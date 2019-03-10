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
