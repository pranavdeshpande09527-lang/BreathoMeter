import time
import asyncio
from fastapi import HTTPException, Request
from collections import defaultdict

from app.utils.logger import app_logger

# ── In-memory sliding window store ───────────────────────────────────────────
# { "rate_key": [timestamp1, timestamp2, ...] }
# For horizontal scaling, replace with a Redis-backed implementation.
_rate_limit_store: dict[str, list[float]] = defaultdict(list)

# ── Per-account failed login tracking ─────────────────────────────────────────
# { "username": [timestamp1, timestamp2, ...] }
_failed_logins: dict[str, list[float]] = defaultdict(list)

_lock = asyncio.Lock()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _rate_limit_key(request: Request) -> str:
    """Builds a composite key: path + client IP + tail of auth token (if present)."""
    forwarded_for = request.headers.get("x-forwarded-for", "")
    client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else (
        request.client.host if request.client else "unknown"
    )
    auth_header = request.headers.get("authorization", "")
    auth_fingerprint = auth_header[-12:] if auth_header.lower().startswith("bearer ") else "anon"
    return f"{request.url.path}:{client_ip}:{auth_fingerprint}"


# ── IP-based sliding window rate limiter ─────────────────────────────────────

async def check_rate_limit(request: Request, limit: int = 5, window_seconds: int = 60):
    """
    Sliding window rate limit — raises HTTP 429 when limit is exceeded.
    Limit and window are passed explicitly so callers can read from settings.
    """
    rate_key = _rate_limit_key(request)
    now = time.time()

    async with _lock:
        history = _rate_limit_store[rate_key]
        window_start = now - window_seconds
        history = [ts for ts in history if ts > window_start]

        if len(history) >= limit:
            _rate_limit_store[rate_key] = history
            app_logger.warning(f"Rate limit exceeded for key: {rate_key}")
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait before trying again."
            )

        history.append(now)
        _rate_limit_store[rate_key] = history


# ── Per-account login backoff / lockout ───────────────────────────────────────

_LOGIN_BACKOFF_WINDOW = 15 * 60  # 15-minute sliding window for failed login tracking


async def check_account_lockout(username: str) -> None:
    """
    Enforces per-account exponential backoff on failed logins.
    - 3+ failures → 5-second delay before proceeding
    - 5+ failures → 30-second delay before proceeding
    - 10+ failures within 15 min → HTTP 429 (account temporarily locked)

    Call this BEFORE attempting Supabase auth. Call record_failed_login() on failure,
    clear_failed_logins() on success.
    """
    now = time.time()
    async with _lock:
        history = [t for t in _failed_logins[username] if t > now - _LOGIN_BACKOFF_WINDOW]
        _failed_logins[username] = history
        count = len(history)

    if count >= 10:
        app_logger.warning(f"Account lockout triggered for username: {username[:3]}***")
        raise HTTPException(
            status_code=429,
            detail="Account temporarily locked due to too many failed attempts. Try again in 15 minutes."
        )
    # Apply backoff delays outside the lock to avoid blocking other coroutines
    if count >= 5:
        await asyncio.sleep(30)
    elif count >= 3:
        await asyncio.sleep(5)


async def record_failed_login(username: str) -> None:
    """Increments the failed-login counter for a username."""
    async with _lock:
        _failed_logins[username].append(time.time())
    app_logger.warning(f"Failed login recorded for: {username[:3]}***")


async def clear_failed_logins(username: str) -> None:
    """Resets the failed-login counter after a successful login."""
    async with _lock:
        _failed_logins.pop(username, None)


# ── Background pruning task ───────────────────────────────────────────────────

async def start_rate_limit_pruner():
    """
    Runs as a background asyncio task (started in main.py lifespan).
    Every 5 minutes: evicts stale entries from both in-memory stores.
    Prevents unbounded memory growth on long-running instances.
    """
    while True:
        await asyncio.sleep(300)  # prune every 5 minutes
        cutoff = time.time() - 3600  # evict keys with all timestamps older than 1 hour
        async with _lock:
            # Prune IP rate-limit store
            stale_rl = [
                k for k, ts_list in _rate_limit_store.items()
                if not any(t > cutoff for t in ts_list)
            ]
            for k in stale_rl:
                del _rate_limit_store[k]

            # Prune failed-login store
            stale_fl = [
                k for k, ts_list in _failed_logins.items()
                if not any(t > cutoff for t in ts_list)
            ]
            for k in stale_fl:
                del _failed_logins[k]

        if stale_rl or stale_fl:
            app_logger.info(
                f"[RateLimitPruner] Evicted {len(stale_rl)} rate-limit keys "
                f"and {len(stale_fl)} failed-login keys."
            )
