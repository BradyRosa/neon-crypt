import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { NeonCrypt, NeonCrypt__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("NeonCrypt")) as NeonCrypt__factory;
  const neonCryptContract = (await factory.deploy()) as NeonCrypt;
  const neonCryptContractAddress = await neonCryptContract.getAddress();

  return { neonCryptContract, neonCryptContractAddress };
}

describe("NeonCrypt", function () {
  let signers: Signers;
  let neonCryptContract: NeonCrypt;
  let neonCryptContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ neonCryptContract, neonCryptContractAddress } = await deployFixture());
  });

  it("should have zero messages after deployment", async function () {
    const totalMessages = await neonCryptContract.getTotalMessages();
    expect(totalMessages).to.eq(0);
  });

  it("should submit an encrypted message", async function () {
    // Encrypt a test message value (using a simple numeric representation)
    const messageValue = 12345;
    const encryptedMessage = await fhevm
      .createEncryptedInput(neonCryptContractAddress, signers.alice.address)
      .add32(messageValue)
      .encrypt();

    // Submit the encrypted message
    const tx = await neonCryptContract
      .connect(signers.alice)
      .submitMessage(encryptedMessage.handles[0], encryptedMessage.inputProof);
    await tx.wait();

    // Verify total messages increased
    const totalMessages = await neonCryptContract.getTotalMessages();
    expect(totalMessages).to.eq(1);

    // Verify user has the message
    const userMessages = await neonCryptContract.getUserMessages(signers.alice.address);
    expect(userMessages.length).to.eq(1);
    expect(userMessages[0]).to.eq(0); // First message ID is 0
  });

  it("should retrieve and decrypt a message", async function () {
    // Submit an encrypted message
    const messageValue = 54321;
    const encryptedMessage = await fhevm
      .createEncryptedInput(neonCryptContractAddress, signers.alice.address)
      .add32(messageValue)
      .encrypt();

    await neonCryptContract
      .connect(signers.alice)
      .submitMessage(encryptedMessage.handles[0], encryptedMessage.inputProof);

    // Get the message
    const [encryptedContent, timestamp, sender, isActive] = await neonCryptContract.getMessage(0);

    expect(sender).to.eq(signers.alice.address);
    expect(isActive).to.eq(true);
    expect(timestamp).to.be.gt(0);
    expect(encryptedContent).to.not.eq(ethers.ZeroHash);

    // Decrypt the message content
    const decryptedValue = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedContent,
      neonCryptContractAddress,
      signers.alice,
    );

    expect(decryptedValue).to.eq(messageValue);
  });

  it("should delete a message", async function () {
    // Submit an encrypted message
    const messageValue = 99999;
    const encryptedMessage = await fhevm
      .createEncryptedInput(neonCryptContractAddress, signers.alice.address)
      .add32(messageValue)
      .encrypt();

    await neonCryptContract
      .connect(signers.alice)
      .submitMessage(encryptedMessage.handles[0], encryptedMessage.inputProof);

    // Verify message is active
    let [, , , isActive] = await neonCryptContract.getMessage(0);
    expect(isActive).to.eq(true);

    // Delete the message
    await neonCryptContract.connect(signers.alice).deleteMessage(0);

    // Verify message is inactive
    [, , , isActive] = await neonCryptContract.getMessage(0);
    expect(isActive).to.eq(false);
  });

  it("should not allow non-owner to delete message", async function () {
    // Alice submits a message
    const messageValue = 11111;
    const encryptedMessage = await fhevm
      .createEncryptedInput(neonCryptContractAddress, signers.alice.address)
      .add32(messageValue)
      .encrypt();

    await neonCryptContract
      .connect(signers.alice)
      .submitMessage(encryptedMessage.handles[0], encryptedMessage.inputProof);

    // Bob tries to delete Alice's message - should fail
    await expect(
      neonCryptContract.connect(signers.bob).deleteMessage(0)
    ).to.be.revertedWith("Not message owner");
  });

  it("should get user message metadata", async function () {
    // Submit multiple messages from Alice
    for (let i = 0; i < 3; i++) {
      const encryptedMessage = await fhevm
        .createEncryptedInput(neonCryptContractAddress, signers.alice.address)
        .add32(i * 100)
        .encrypt();

      await neonCryptContract
        .connect(signers.alice)
        .submitMessage(encryptedMessage.handles[0], encryptedMessage.inputProof);
    }

    // Get metadata
    const [timestamps, messageIds, activeStatus] = await neonCryptContract.getUserMessageMetadata(
      signers.alice.address
    );

    expect(timestamps.length).to.eq(3);
    expect(messageIds.length).to.eq(3);
    expect(activeStatus.length).to.eq(3);

    // All should be active
    for (const status of activeStatus) {
      expect(status).to.eq(true);
    }
  });

  it("should get message count for user", async function () {
    // Submit 2 messages from Alice
    for (let i = 0; i < 2; i++) {
      const encryptedMessage = await fhevm
        .createEncryptedInput(neonCryptContractAddress, signers.alice.address)
        .add32(i)
        .encrypt();

      await neonCryptContract
        .connect(signers.alice)
        .submitMessage(encryptedMessage.handles[0], encryptedMessage.inputProof);
    }

    const aliceCount = await neonCryptContract.getMessageCount(signers.alice.address);
    const bobCount = await neonCryptContract.getMessageCount(signers.bob.address);

    expect(aliceCount).to.eq(2);
    expect(bobCount).to.eq(0);
  });
});

