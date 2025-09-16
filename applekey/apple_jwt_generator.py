import jwt
import time
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec

# Configuration
key_file = "C:/Users/LG/Downloads/AuthKey_K4C773WU2S.p8"  # Replace with actual path
team_id = "D2F9RZT54S"  # Replace with your Apple Team ID
client_id = "com.styleai.app"  # Replace with your app bundle ID
key_id = "K4C773WU2S"  # Replace with your key ID
validity_period = 180  # In days. Max 180 (6 months) according to Apple docs.

# 注意：这个脚本生成的是Apple Client Secret，用于Supabase配置
# 不是用户认证token（用户认证token由Apple直接生成）

# Load the private key
with open(key_file, 'rb') as f:
    private_key = serialization.load_pem_private_key(
        f.read(),
        password=None,  # Add password if your key is encrypted
    )

# Create the JWT payload
payload = {
    'iss': team_id,
    'iat': int(time.time()),
    'exp': int(time.time()) + 86400 * validity_period,
    'aud': 'https://appleid.apple.com',
    'sub': client_id
}

# Create the JWT header
headers = {
    'kid': key_id
}

# Generate the JWT token
token = jwt.encode(
    payload,
    private_key,
    algorithm='ES256',
    headers=headers
)

print(token)
