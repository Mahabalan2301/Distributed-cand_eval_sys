# Secure Assessment Handshake (Token Design)

The transition between the **Candidate Portal** and the independent **Assessment Engine** is the most security-sensitive path in the system. We use a multi-stage handshake to ensure test integrity.

## 🔐 The Handshake Protocol

1. **Generation**: When a candidate clicks "Start Assessment", the Auth Service:
   - Verifies the user's main JWT.
   - Generates a unique `nonce` (16-byte random string).
   - Signs a new **Assessment JWT** containing the `userId`, `applicationId`, and the `nonce`.
   - Stores the `nonce` in Redis with a **2-minute expiration** (`SET nonce:xyz valid EX 120`).

2. **Handoff**: The portal redirects the user to the Assessment Engine URL with the token in the query string:
   `https://assessment-engine.../?token=eyJhbGci...`

3. **Validation (Single-Use)**: The Assessment Engine sends the token to `POST /validate-assessment`. The Auth Service:
   - Verifies the JWT signature.
   - Checks if the `nonce` exists in Redis.
   - **DELETES the nonce immediately** (`DEL nonce:xyz`).
   - If successful, the engine displays the questions.

## 🛡️ Security Benefits

- **No Link Sharing**: Because the `nonce` is deleted after the first use, if a candidate shares the assessment URL with a friend, the link will be invalid.
- **Strict Time Window**: The 2-minute window ensures that tokens must be used immediately, reducing the surface area for man-in-the-middle attacks.
- **Stateless Verification**: The Assessment Engine doesn't need to know the user's session—it only needs to verify the validity of the signed assessment token.
