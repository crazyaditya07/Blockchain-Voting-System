# Blockchain Voting System

A secure and transparent voting platform built on blockchain technology. This system allows users to create proposals, vote on them, and view results in a decentralized way.

## What is this project?

This is a web application that combines:
- **Smart Contracts** on Ethereum blockchain for secure voting logic
- **React Frontend** for user interaction
- **Web3 Integration** to connect with crypto wallets

## Features

- 🔐 Secure wallet connection (MetaMask, etc.)
- 📝 Create voting proposals
- 🗳️ Cast votes on proposals
- 📊 View real-time voting results
- 🎨 Cyberpunk-themed UI
- 🔒 Decentralized and tamper-proof

## How to Use

### For Voters
1. Connect your crypto wallet
2. Register as a voter
3. Browse available proposals
4. Vote on proposals you care about
5. Check results after voting ends

### For Proposal Creators
1. Connect your wallet
2. Create a new proposal with description
3. Set voting parameters
4. Share with potential voters

## Getting Started (For Developers)

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn
- MetaMask or another Web3 wallet
- Hardhat (for smart contract development)

### Installation

1. **Clone the repository**
   ```
   git clone https://github.com/crazyaditya07/Blockchain-Voting-System.git
   cd Blockchain-Voting-System
   ```

2. **Install dependencies**
   ```
   npm install
   cd frontend
   npm install
   cd ..
   ```

3. **Set up environment**
   - Copy `.env.example` to `.env`
   - Add your configuration (API keys, etc.)

4. **Deploy smart contracts (optional for development)**
   ```
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network localhost
   ```

5. **Start the development server**
   ```
   cd frontend
   npm start
   ```

6. **Open your browser**
   Go to http://localhost:3000

## Project Structure

```
Blockchain-Voting-System/
├── contracts/          # Smart contracts (Solidity)
├── frontend/           # React application
├── scripts/            # Deployment scripts
├── test/               # Smart contract tests
└── README.md          # This file
```

## Technologies Used

- **Frontend**: React, CSS3, Web3.js
- **Backend**: Ethereum Smart Contracts (Solidity)
- **Tools**: Hardhat, Ethers.js, MetaMask

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. Please check the license file for details.

## Support

If you have questions or need help:
- Check the issues section
- Create a new issue with details
- Contact the maintainers

---

**Note**: This is a demonstration project. For real elections, additional security audits and legal compliance are required.