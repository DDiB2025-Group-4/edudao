# EduDAO

A privacy-preserving educational credential platform powered by blockchain and SD-JWT technology.

## Vision

EduDAO revolutionizes how educational achievements are issued, owned, and verified. We believe that individuals should have complete control over their educational records while institutions maintain the ability to issue tamper-proof credentials. Our platform empowers students with selective disclosure capabilities, allowing them to share only the information they choose while maintaining cryptographic proof of their achievements.

## Key Features

### 🔐 Privacy-First Design with SD-JWT
- **Selective Disclosure**: Students can choose which fields to reveal when presenting credentials
- **Zero-Knowledge Properties**: Prove you have a degree without revealing personal details
- **Cryptographic Security**: Uses SD-JWT (Selective Disclosure JSON Web Tokens) for verifiable credentials

### 🔗 Blockchain-Backed Integrity
- **Immutable Records**: Educational certificates stored as NFTs on Ethereum blockchain
- **Tamper-Proof**: Once issued, credentials cannot be altered or forged
- **Decentralized Verification**: No central authority needed for verification

### ✅ Multi-Layer Verification
- **Dual Signature System**: Both issuer and holder signatures required
- **Time-Bound Presentations**: QR codes expire after 5 minutes for security
- **On-Chain Validation**: Real-time verification against blockchain data

## Technical Architecture

### Smart Contracts
- **EduNFT**: ERC-721 based certificate storage with metadata URIs
- **EduControl**: Access control and permission management
- **Upgradeable Design**: Proxy pattern for future improvements

### Credential Flow
1. **Issuance**: Educational institutions mint NFT certificates with student data
2. **Storage**: Students hold credentials in their wallets with full ownership
3. **Presentation**: Generate time-limited QR codes with selective disclosure
4. **Verification**: Instant verification through multi-step validation process

### Privacy Features
- **Selective Field Disclosure**: Choose to share only:
  - Name
  - University
  - Degree Level
  - Graduation Year
  - Faculty
  - Or any combination
- **Holder Binding**: Credentials cryptographically bound to wallet addresses
- **Presentation Proofs**: Each presentation requires holder signature

## Project Structure

```
edudao/
├── packages/
│   ├── contracts/     # Solidity smart contracts
│   │   ├── EduNFT.sol
│   │   ├── EduControl.sol
│   │   └── IERC5192.sol (Soulbound token interface)
│   └── frontend/      # React-based web interface
│       ├── src/
│       │   ├── routes/
│       │   │   ├── issuer.tsx    # Institution interface
│       │   │   ├── holder.tsx    # Student dashboard
│       │   │   └── verifier.tsx  # QR verification
│       │   └── lib/
│       │       └── thirdweb.ts   # Blockchain integration
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation
```bash
# Clone the repository
git clone https://github.com/DDiB2025-Group-4/edudao.git

# Install dependencies
npm install
```

### Development
```bash
# Run specific workspace
npm run dev --workspace=frontend
```

## Technologies

### Blockchain & Smart Contracts
- **Solidity**: Smart contract development
- **Hardhat**: Development environment and testing
- **OpenZeppelin**: Secure contract implementations
- **Optimism Sepolia**: Testnet deployment

### Frontend
- **React 18**: User interface framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tooling
- **TanStack Router**: Type-safe routing
- **Thirdweb SDK**: Web3 integration

### Cryptography & Standards
- **SD-JWT**: Selective Disclosure JSON Web Tokens
- **ERC-721**: NFT standard for certificates
- **ERC-5192**: Soulbound token interface
- **ECDSA**: Digital signature algorithm

## Security Considerations

- All credentials are cryptographically signed by issuers
- Time-limited presentations prevent replay attacks
- Holder signatures ensure consent for disclosure
- Smart contracts audited for common vulnerabilities
- Private keys never leave user devices

## Contact

- GitHub: [https://github.com/DDiB2025-Group-4/edudao](https://github.com/DDiB2025-Group-4/edudao)
- Issues: [https://github.com/DDiB2025-Group-4/edudao/issues](https://github.com/DDiB2025-Group-4/edudao/issues)