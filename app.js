const moment = require('moment')
const bigInt = require('big-integer')
const {
  Account,
  Asset,
  Keypair,
  Network,
  Operation,
  Server,
  TransactionBuilder,
} = require('stellar-sdk')

const TIMEOUT_CLAIM = moment.duration(2, 'week').seconds()
const TIMEOUT_CLAIM_DELAY = moment.duration(1, 'week').seconds()

const server = new Server('https://horizon-testnet.stellar.org')
Network.useTestNetwork()

// Alice and Bob are preexisting funded accounts controlled by AliceKeypair and BobKeypair

const AliceKeypair = Keypair.fromSecret('SCIXVMGTGHIOVMHRA7B7ICJ4XWAYSQP67VNSLNXS7OYZKXDS7I45OJUE')
const AliceKey = AliceKeypair.publicKey()
const Alice = await server.loadAccount(AliceKeypair.publicKey())

// Alice generates throwaway keys for her version account and for the ratchet account
const AliceVersionKeypair = Keypair.random()
const AliceRatchetKeypair = Keypair.random()

const AliceVersionKey = AliceVersionKeypair.publicKey()
const AliceRatchetKey = AliceRatchetKeypair.publicKey()

// Bob does the same
const BobKeypair = Keypair.fromSecret('SAJ2ISPPRUA4MPCDFOILZ6E4H3X6I4OVTMPX4QZBLXTMWMSKO5MC4H6E')
const BobKey = BobKeypair.publicKey()
const Bob = await server.loadAccount(BobKey)

const BobVersionKeypair = Keypair.random()
const BobRatchetKeypair = Keypair.random()

const BobVersionKey = BobVersionKeypair.publicKey()
const BobRatchetKey = BobRatchetKeypair.publicKey()

// the Ratchet account ID is Alice's ratchet key
const RatchetAccountId = AliceRatchetKeypair.publicKey()

const setupAccountsTx = new TransactionBuilder(Alice)
  .addOperation(
    Operation.createAccount({
      destination: AliceVersionKey,
      startingBalance: '1',
    })
  )
  .addOperation(
    Operation.createAccount({
      destination: BobVersionKey,
      startingBalance: '1',
    })
  )
  .addOperation(
    // set up the ratchet account
    // which initially has only Alice's ratchet key
    // the funding transaction will add Bob's key
    Operation.createAccount({
      destination: AliceRatchetKey,
      startingBalance: '2',
    })
  )
  .build()

setupAccountsTx.sign(AliceKeypair)
await server.submitTransaction(setupAccountsTx)

const AliceVersion = await server.loadAccount(AliceVersionKey)
const BobVersion = await server.loadAccount(BobVersionKey)
const Ratchet = await server.loadAccount(RatchetAccountId)

const Round0Time = moment().unix()
const RatchetSequenceNumber = bigInt(Ratchet.sequenceNumber())
const Ratchet0SequenceNumber = RatchetSequenceNumber.plus(3)

const Snapshot0Alice = new TransactionBuilder(
  new Account(RatchetAccountId, Ratchet0SequenceNumber.toString()),
  {
    timebounds: {
      minTime: Round0Time + TIMEOUT_CLAIM + TIMEOUT_CLAIM_DELAY,
      maxTime: 0,
    },
  }
)
  .addOperation(
    Operation.payment({
      destination: Alice.accountId(),
      asset: Asset.native(),
      amount: '250',
    })
  )
  .build()

const Snapshot0Bob = new TransactionBuilder(
  new Account(
    RatchetAccountId,
    Ratchet0SequenceNumber.plus(1).toString()
  ),
  {
    timebounds: {
      minTime: Round0Time + TIMEOUT_CLAIM + TIMEOUT_CLAIM_DELAY,
      maxTime: 0,
    },
  }
)
  .addOperation(
    // gives control over the ratchet, and its remaining 750 lumens, to Bob
    Operation.setOptions({
      signer: { ed25519PublicKey: BobKey, weight: 2 },
    })
  )
  .build()

// exchange signatures
Snapshot0Bob.sign(AliceRatchetKeypair)
Snapshot0Alice.sign(BobRatchetKeypair)

const Ratchet0Alice = new TransactionBuilder(
  new Account(AliceVersion.accountId(), AliceVersion.sequenceNumber()),
  { timebounds: { minTime: Round0Time, maxTime: Round0Time + TIMEOUT_CLAIM } }
)
  .addOperation(
    Operation.BumpSequence({
      sourceAccount: RatchetKey,
      target: Ratchet0SequenceNumber.minus(1).toString(),
    })
  )
  .build()

const Ratchet0Bob = new TransactionBuilder(
  new Account(BobVersion.accountId(), BobVersion.sequenceNumber()),
  { timebounds: { minTime: Round0Time, maxTime: Round0Time + TIMEOUT_CLAIM } }
)
  .addOperation(
    Operation.BumpSequence({
      sourceAccount: RatchetKey,
      target: Ratchet0SequenceNumber.minus(1).toString(),
    })
  )
  .build()

