# Organ Donation Blockchain System

A blockchain-based decentralized organ donation registry using Ethereum and React.

## Features
- Admin registers hospitals  
- Donor and Recipient specific accounts to register donor and recipients  
- Hospital account to verify the registered donors and recipients
- Match donors and recipients by organ type and tissue type  
- Update recipient urgency  
- Confirm organ retrieval  
- Secure data via smart contracts  

## Tech Stack
- **Solidity**, **Truffle**  
- **React.js**, **Web3.js**  
- **Ganache**, **MetaMask**  

## 🖼️ Screenshots

For a full demo of the UI and workflow, please check the [📂 screenshots folder](./screenshots) in this repository.


## Setup Instructions

### Backend

```bash
npm install
truffle compile
truffle migrate --network development

### Frontend

```bash
cd organ-donation-frontend
npm install
npm start
