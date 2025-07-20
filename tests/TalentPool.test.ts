import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

describe("TalentPool Contract Tests", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("should mint a time-locked NFT successfully", () => {
    const unlockBlock = simnet.blockHeight + 10;
    const { result } = simnet.callPublicFn(
      "TalentPool",
      "mint-time-locked-nft",
      [simnet.types.principal(address1), simnet.types.uint(unlockBlock)],
      deployer
    );
    
    expect(result).toBeOk(simnet.types.uint(1));
  });

  it("should get NFT info correctly", () => {
    const unlockBlock = simnet.blockHeight + 10;
    
    // First mint an NFT
    simnet.callPublicFn(
      "TalentPool",
      "mint-time-locked-nft",
      [simnet.types.principal(address1), simnet.types.uint(unlockBlock)],
      deployer
    );

    // Then get its info
    const { result } = simnet.callReadOnlyFn(
      "TalentPool",
      "get-nft-info",
      [simnet.types.uint(1)],
      address1
    );

    expect(result).toBeSome(
      simnet.types.tuple({
        owner: simnet.types.principal(address1),
        unlock: simnet.types.uint(unlockBlock)
      })
    );
  });

  it("should check if NFT is unlocked correctly", () => {
    const unlockBlock = simnet.blockHeight + 10;
    
    // Mint an NFT
    simnet.callPublicFn(
      "TalentPool",
      "mint-time-locked-nft",
      [simnet.types.principal(address1), simnet.types.uint(unlockBlock)],
      deployer
    );

    // Check if locked (should be false since unlock block is in future)
    const { result: lockedResult } = simnet.callReadOnlyFn(
      "TalentPool",
      "is-nft-unlocked",
      [simnet.types.uint(1)],
      address1
    );

    expect(lockedResult).toBeBool(false);
  });

  it("should prevent transfer of locked NFT", () => {
    const unlockBlock = simnet.blockHeight + 10;
    
    // Mint an NFT
    simnet.callPublicFn(
      "TalentPool",
      "mint-time-locked-nft",
      [simnet.types.principal(address1), simnet.types.uint(unlockBlock)],
      deployer
    );

    // Try to transfer locked NFT (should fail)
    const { result } = simnet.callPublicFn(
      "TalentPool",
      "transfer-talent-nft",
      [
        simnet.types.uint(1),
        simnet.types.principal(address1),
        simnet.types.principal(address2)
      ],
      address1
    );

    expect(result).toBeErr(simnet.types.uint(101)); // ERR-NOT-UNLOCKED
  });

  it("should allow transfer of unlocked NFT", () => {
    const unlockBlock = simnet.blockHeight + 1;
    
    // Mint an NFT
    simnet.callPublicFn(
      "TalentPool",
      "mint-time-locked-nft",
      [simnet.types.principal(address1), simnet.types.uint(unlockBlock)],
      deployer
    );

    // Mine blocks to unlock the NFT
    simnet.mineEmptyBlocks(2);

    // Transfer unlocked NFT (should succeed)
    const { result } = simnet.callPublicFn(
      "TalentPool",
      "transfer-talent-nft",
      [
        simnet.types.uint(1),
        simnet.types.principal(address1),
        simnet.types.principal(address2)
      ],
      address1
    );

    expect(result).toBeOk(simnet.types.bool(true));

    // Verify new owner
    const { result: ownerResult } = simnet.callReadOnlyFn(
      "TalentPool",
      "get-nft-owner",
      [simnet.types.uint(1)],
      address1
    );

    expect(ownerResult).toBeSome(simnet.types.principal(address2));
  });

  it("should allow admin to emergency unlock", () => {
    const unlockBlock = simnet.blockHeight + 10;
    
    // Mint an NFT
    simnet.callPublicFn(
      "TalentPool",
      "mint-time-locked-nft",
      [simnet.types.principal(address1), simnet.types.uint(unlockBlock)],
      deployer
    );

    // Emergency unlock by admin
    const { result } = simnet.callPublicFn(
      "TalentPool",
      "emergency-unlock",
      [simnet.types.uint(1)],
      deployer
    );

    expect(result).toBeOk(simnet.types.bool(true));

    // Check if now unlocked
    const { result: unlockedResult } = simnet.callReadOnlyFn(
      "TalentPool",
      "is-nft-unlocked",
      [simnet.types.uint(1)],
      address1
    );

    expect(unlockedResult).toBeBool(true);
  });

  it("should allow admin to update unlock time", () => {
    const unlockBlock = simnet.blockHeight + 10;
    const newUnlockBlock = simnet.blockHeight + 20;
    
    // Mint an NFT
    simnet.callPublicFn(
      "TalentPool",
      "mint-time-locked-nft",
      [simnet.types.principal(address1), simnet.types.uint(unlockBlock)],
      deployer
    );

    // Update unlock time by admin
    const { result } = simnet.callPublicFn(
      "TalentPool",
      "update-unlock-time",
      [simnet.types.uint(1), simnet.types.uint(newUnlockBlock)],
      deployer
    );

    expect(result).toBeOk(simnet.types.bool(true));

    // Verify new unlock block
    const { result: unlockResult } = simnet.callReadOnlyFn(
      "TalentPool",
      "get-unlock-block",
      [simnet.types.uint(1)],
      address1
    );

    expect(unlockResult).toBeSome(simnet.types.uint(newUnlockBlock));
  });

  it("should get contract owner correctly", () => {
    const { result } = simnet.callReadOnlyFn(
      "TalentPool",
      "get-contract-owner",
      [],
      address1
    );

    expect(result).toBePrincipal(deployer);
  });

  it("should allow ownership transfer", () => {
    // Transfer ownership to address1
    const { result } = simnet.callPublicFn(
      "TalentPool",
      "transfer-ownership",
      [simnet.types.principal(address1)],
      deployer
    );

    expect(result).toBeOk(simnet.types.bool(true));

    // Verify new owner
    const { result: ownerResult } = simnet.callReadOnlyFn(
      "TalentPool",
      "get-contract-owner",
      [],
      address1
    );

    expect(ownerResult).toBePrincipal(address1);
  });

  it("should prevent non-owner from admin functions", () => {
    const unlockBlock = simnet.blockHeight + 10;
    
    // Mint an NFT
    simnet.callPublicFn(
      "TalentPool",
      "mint-time-locked-nft",
      [simnet.types.principal(address1), simnet.types.uint(unlockBlock)],
      deployer
    );

    // Try emergency unlock as non-admin (should fail)
    const { result: emergencyResult } = simnet.callPublicFn(
      "TalentPool",
      "emergency-unlock",
      [simnet.types.uint(1)],
      address1
    );

    expect(emergencyResult).toBeErr(simnet.types.uint(103)); // ERR-NOT-AUTHORIZED

    // Try update unlock time as non-admin (should fail)
    const { result: updateResult } = simnet.callPublicFn(
      "TalentPool",
      "update-unlock-time",
      [simnet.types.uint(1), simnet.types.uint(unlockBlock + 5)],
      address1
    );

    expect(updateResult).toBeErr(simnet.types.uint(103)); // ERR-NOT-AUTHORIZED

    // Try ownership transfer as non-admin (should fail)
    const { result: transferResult } = simnet.callPublicFn(
      "TalentPool",
      "transfer-ownership",
      [simnet.types.principal(address2)],
      address1
    );

    expect(transferResult).toBeErr(simnet.types.uint(103)); // ERR-NOT-AUTHORIZED
  });

  it("should prevent non-owner from transferring NFT", () => {
    const unlockBlock = simnet.blockHeight + 1;
    
    // Mint an NFT
    simnet.callPublicFn(
      "TalentPool",
      "mint-time-locked-nft",
      [simnet.types.principal(address1), simnet.types.uint(unlockBlock)],
      deployer
    );

    // Mine blocks to unlock the NFT
    simnet.mineEmptyBlocks(2);

    // Try to transfer as non-owner (should fail)
    const { result } = simnet.callPublicFn(
      "TalentPool",
      "transfer-talent-nft",
      [
        simnet.types.uint(1),
        simnet.types.principal(address1),
        simnet.types.principal(address2)
      ],
      address2 // Wrong sender
    );

    expect(result).toBeErr(simnet.types.uint(100)); // ERR-NOT-OWNER
  });

  it("should prevent redeeming locked NFT", () => {
    const unlockBlock = simnet.blockHeight + 10;
    
    // Mint an NFT
    simnet.callPublicFn(
      "TalentPool",
      "mint-time-locked-nft",
      [simnet.types.principal(address1), simnet.types.uint(unlockBlock)],
      deployer
    );

    // Try to redeem locked NFT (should fail)
    const { result } = simnet.callPublicFn(
      "TalentPool",
      "redeem-nft",
      [simnet.types.uint(1)],
      address1
    );

    expect(result).toBeErr(simnet.types.uint(101)); // ERR-NOT-UNLOCKED
  });

  it("should allow redeeming unlocked NFT", () => {
    const unlockBlock = simnet.blockHeight + 1;
    
    // Mint an NFT
    simnet.callPublicFn(
      "TalentPool",
      "mint-time-locked-nft",
      [simnet.types.principal(address1), simnet.types.uint(unlockBlock)],
      deployer
    );

    // Mine blocks to unlock the NFT
    simnet.mineEmptyBlocks(2);

    // Redeem unlocked NFT (should succeed)
    const { result } = simnet.callPublicFn(
      "TalentPool",
      "redeem-nft",
      [simnet.types.uint(1)],
      address1
    );

    expect(result).toBeOk(simnet.types.ascii("Redeemed"));
  });

  it("should get next ID correctly", () => {
    const { result: initialId } = simnet.callReadOnlyFn(
      "TalentPool",
      "get-next-id",
      [],
      address1
    );

    expect(initialId).toBeUint(1);

    // Mint an NFT
    simnet.callPublicFn(
      "TalentPool",
      "mint-time-locked-nft",
      [simnet.types.principal(address1), simnet.types.uint(simnet.blockHeight + 10)],
      deployer
    );

    const { result: nextId } = simnet.callReadOnlyFn(
      "TalentPool",
      "get-next-id",
      [],
      address1
    );

    expect(nextId).toBeUint(2);
  });

  it("should handle non-existent NFT queries", () => {
    // Try to get info for non-existent NFT
    const { result: infoResult } = simnet.callReadOnlyFn(
      "TalentPool",
      "get-nft-info",
      [simnet.types.uint(999)],
      address1
    );

    expect(infoResult).toBeNone();

    // Try to check if non-existent NFT is unlocked
    const { result: unlockedResult } = simnet.callReadOnlyFn(
      "TalentPool",
      "is-nft-unlocked",
      [simnet.types.uint(999)],
      address1
    );

    expect(unlockedResult).toBeBool(false);

    // Try to get owner of non-existent NFT
    const { result: ownerResult } = simnet.callReadOnlyFn(
      "TalentPool",
      "get-nft-owner",
      [simnet.types.uint(999)],
      address1
    );

    expect(ownerResult).toBeNone();
  });
});