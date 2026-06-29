import urllib.request
import urllib.error
import json

data = json.dumps({'username': 'pranav ', 'password': 'Pr@131006'}).encode('utf-8')
req = urllib.request.Request('https://breathometer6-0-4ago.onrender.com/auth/login', data=data, headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f'HTTPError: {e.code}')
    print(e.read().decode('utf-8'))
