# Time-Locked Talent NFT

This project implements a Clarity smart contract for minting, managing, and transferring time-locked non-fungible tokens (NFTs) on the Stacks blockchain. Each NFT is associated with an unlock block height, restricting transfers and redemption until the specified block is reached.

## Features

**Minting Time-Locked NFTs:** Only the contract owner can mint NFTs with a specified unlock block.
**Transfer NFTs:** Owners can transfer NFTs to others only after the unlock block is reached.
**Redeem NFTs:** Owners can redeem their NFTs once unlocked.
**Emergency Unlock:** The contract owner can unlock any NFT immediately.
**Update Unlock Time:** The contract owner can update the unlock block for any NFT.
**Ownership Management:** The contract owner can transfer contract ownership.
**Read-Only Queries:** Functions to get NFT info, owner, unlock block, next/last token ID, and contract owner.

## Contract Functions

### Public Functions

- `mint-time-locked-nft(recipient, unlock-block)`  
  Mint a new NFT for a recipient, locked until a specific block.

- `transfer-talent-nft(id, sender, recipient)`  
  Transfer an NFT if it is unlocked and the sender is the owner.

- `redeem-nft(id)`  
  Redeem an NFT if it is unlocked and the caller is the owner.

- `emergency-unlock(id)`  
  Admin function to unlock an NFT immediately.

- `update-unlock-time(id, new-unlock-block)`  
  Admin function to update the unlock block for an NFT.

- `transfer-ownership(new-owner)`  
  Admin function to transfer contract ownership.

### Read-Only Functions

- `get-nft-info(id)`  
  Get all info for a specific NFT.

- `is-nft-unlocked(id)`  
  Check if an NFT is unlocked.

- `get-contract-owner()`  
  Get the contract owner's principal.

- `get-nft-owner(id)`  
  Get the owner of a specific NFT.

- `get-next-id()`  
  Get the next NFT ID to be minted.

- `get-unlock-block(id)`  
  Get the unlock block for a specific NFT.

- `get-last-token-id()`  
  Get the last minted NFT ID.

- `get-token-uri(id)`  
  Returns `none` (no metadata URI implemented).

## Error Codes

- `ERR-NOT-OWNER` (u100): Caller is not the owner.
- `ERR-NOT-UNLOCKED` (u101): NFT is still locked.
- `ERR-NOT-FOUND` (u102): NFT not found.
- `ERR-NOT-AUTHORIZED` (u103): Caller is not authorized.
- `ERR-MINT-FAILED` (u105): Minting failed.
- `ERR-TRANSFER-FAILED` (u106): Transfer failed.

## Requirements

- Stacks blockchain
- Clarity smart contract language

## License

This project is provided as-is for educational and demonstration purposes.
