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

const AliceKeypair = Keypair.fromSecret('SAOUXBXNAG6PLZZQIG3CYU555RCJSQT46YVVSO7CBB2DMIO7JEZU4MK4')
const AliceKey = AliceKeypair.publicKey()

// Alice generates throwaway keys for her version account and for the ratchet account
const AliceVersionKeypair = Keypair.random()
const AliceRatchetKeypair = Keypair.random()

const AliceVersionKey = AliceVersionKeypair.publicKey()
const AliceRatchetKey = AliceRatchetKeypair.publicKey()

const TIMEOUT_CLAIM = moment.duration(2, 'week').seconds()
const TIMEOUT_CLAIM_DELAY = moment.duration(1, 'week').seconds()

const server = new Server('https://horizon-testnet.stellar.org')
Network.useTestNetwork()

// Alice and Bob are preexisting funded accounts controlled by AliceKeypair and BobKeypair

const AliceKeypair = Keypair.fromSecret('SAOUXBXNAG6PLZZQIG3CYU555RCJSQT46YVVSO7CBB2DMIO7JEZU4MK4')
const AliceKey = AliceKeypair.publicKey()

// Alice generates throwaway keys for her version account and for the ratchet account
const AliceVersionKeypair = Keypair.random()
const AliceRatchetKeypair = Keypair.random()

const AliceVersionKey = AliceVersionKeypair.publicKey()
const AliceRatchetKey = AliceRatchetKeypair.publicKey()

// Bob does the same
const BobKeypair = Keypair.fromSecret('SAQZRQFCUTMZFVSF7HSSWORDS5WRBBCMR5HWGP3NTBBEK7BGKEU5KRQP')
const BobKey = BobKeypair.publicKey()

const BobVersionKeypair = Keypair.random()
const BobRatchetKeypair = Keypair.random()

const BobVersionKey = BobVersionKeypair.publicKey()
const BobRatchetKey = BobRatchetKeypair.publicKey()

// the Ratchet account ID is Alice's ratchet key
const RatchetAccountId = AliceRatchetKeypair.publicKey()


const Alice = await server.loadAccount(AliceKeypair.publicKey())
const Bob = await server.loadAccount(BobKey)

console.log("Alice.publicKey is " + AliceKey);
console.log("Bob.publicKey is " + BobKey);
console.log();
console.log("Also, AliceVersionKey, AliceRatchetKey, BobVersionKey, BobRatchetKey are generated");

// 	await ctx.render('stellar/step1', {
//         session : ctx.session,
// 		step : 1,
//     })
// }

// exports.step2 = async ctx => {

// create three accounts

const setupAccountsTx = new TransactionBuilder(Alice, {fee: 100}).addOperation(
	Operation.createAccount({
	destination: AliceVersionKey,
	startingBalance: '1',
	})
).addOperation(
	Operation.createAccount({
	destination: BobVersionKey,
	startingBalance: '1',
	})
).addOperation(
	// set up the ratchet account
	// which initially has only Alice's ratchet key
	// the funding transaction will add Bob's key
	Operation.createAccount({
	destination: AliceRatchetKey,
	startingBalance: '2',
	})
)
.setTimeout(1000)
.build()

setupAccountsTx.sign(AliceKeypair)
await server.submitTransaction(setupAccountsTx)

const AliceVersion = await server.loadAccount(AliceVersionKey)
const BobVersion = await server.loadAccount(BobVersionKey)
const Ratchet = await server.loadAccount(RatchetAccountId)

console.log(Alice.balances);
console.log(Bob.balances);
console.log(AliceVersion.balances);
console.log(BobVersion.balances);
console.log(Ratchet.balances);
console.log("====== ====== ====== ====== ======")

// 	await ctx.render('stellar/step2', {
//         session : ctx.session,
// 		step : 2,
//     })
// }

// exports.step3 = async ctx => {

// First, they prepare snapshot transactions reflecting their
// current balances, and exchange their signatures on them.

const Round0Time = moment().unix()
const RatchetSequenceNumber = bigInt(Ratchet.sequenceNumber())
const Ratchet0SequenceNumber = RatchetSequenceNumber.plus(3)

const Snapshot0Alice = new TransactionBuilder(
	new Account(
		RatchetAccountId,
		Ratchet0SequenceNumber.toString()
	),
	{
		fee: 100,
		timebounds: {
			minTime: Round0Time + TIMEOUT_CLAIM + TIMEOUT_CLAIM_DELAY,
			maxTime: 0,
		},
	},
	{fee: 100},
).addOperation(
	Operation.payment({
	destination: AliceKey,
	asset: Asset.native(),
	amount: '250',
	})
)
.setTimeout(1000)
.build()

const Snapshot0Bob = new TransactionBuilder(
	new Account(
		RatchetAccountId,
		Ratchet0SequenceNumber.plus(1).toString()
	),
	{
		fee: 100,
		timebounds: {
			minTime: Round0Time + TIMEOUT_CLAIM + TIMEOUT_CLAIM_DELAY,
			maxTime: 0,
		},
	}
).addOperation(
	// gives control over the ratchet, and its remaining 750 lumens, to Bob
	Operation.setOptions({
	signer: { ed25519PublicKey: BobKey, weight: 2 },
	})
)
.setTimeout(1000)
.build()

// exchange signatures
Snapshot0Bob.sign(AliceRatchetKeypair)
Snapshot0Alice.sign(BobRatchetKeypair)
console.log("Tx Snapshot0Bob is signed by Alice (ratchet key)");
console.log("Tx Snapshot0Alice is signed by Bob (ratchet key)");

console.log(Alice.balances);
console.log(Bob.balances);
console.log(AliceVersion.balances);
console.log(BobVersion.balances);
console.log(Ratchet.balances);
console.log("====== ====== ====== ====== ======")

// 	await ctx.render('stellar/step3', {
//         session : ctx.session,
// 		step : 3,
//     })
// }

// exports.step4 = async ctx => {

// exchange their initial Ratchet transactions, which will bump
// the sequence number of the ratchet account to the sequence
// number immediately preceding the snapshot transactions

const Ratchet0Alice = new TransactionBuilder(
	new Account(
		AliceVersion.accountId(),
		AliceVersion.sequenceNumber()
	),
	{
		fee: 100,
		timebounds: {
			minTime: Round0Time,
			maxTime: Round0Time + TIMEOUT_CLAIM
		}
	}
  )
	.addOperation(
		Operation.bumpSequence({
			bumpTo: Ratchet0SequenceNumber.minus(1).toString(),
			source: RatchetAccountId,
		})
	)
	.build()

  const Ratchet0Bob = new TransactionBuilder(
	new Account(
		BobVersion.accountId(),
		BobVersion.sequenceNumber()
	),
	{
		fee: 100,
		timebounds: {
			minTime: Round0Time,
			maxTime: Round0Time + TIMEOUT_CLAIM
		}
	}
  )
	.addOperation(
		Operation.bumpSequence({
			bumpTo: Ratchet0SequenceNumber.minus(1).toString(),
			source: RatchetAccountId,
		})
	)
	.build()


const fundingTx = new TransactionBuilder(Ratchet)
  .addOperation(
    Operation.payment({
      source: Alice.accountId(),
      destination: Ratchet.accountId(),
      asset: Asset.native(),
      amount: '248', // Alice has already paid in 2 lumens
    })
  )
  .addOperation(
    Operation.payment({
      source: Bob.accountId(),
      destination: Ratchet.accountId(),
      asset: Asset.native(),
      amount: '750',
    })
  )
  .addOperation(
    Operation.setOptions({
      signer: { ed25519PublicKey: BobRatchetKey, weight: 1 },
      lowThreshold: 2,
      medThreshold: 2,
      highThreshold: 2,
    })
  )
  .build()

fundingTx.sign(AliceKeypair)
fundingTx.sign(BobKeypair)
fundingTx.sign(AliceRatchetKeypair)

await server.submitTransaction(fundingTx)


Const Ratchet1SequenceNumber = Ratchet0SequenceNumber.plus(3)
const Ratchet1Account = new Account(
  Ratchet.accountId(),
  Ratchet1SequenceNumber.toString()
)

const Round1Time = moment().unix()

const Snapshot1Alice = new TransactionBuilder(
  new Account(RatchetAccountId, Ratchet1SequenceNumber.toString()),
  {
    timebounds: {
      minTime: Round1Time + TIMEOUT_CLAIM + TIMEOUT_CLAIM_DELAY,
      maxTime: 0,
    },
  }
)
  .addOperation(
    Operation.payment({
      destination: Alice.accountId(),
      asset: Asset.native(),
      amount: ‘500’,
    })
  )
  .build()

const Snapshot1Bob = new TransactionBuilder(
  new Account(
    RatchetAccountId,
    Ratchet1SequenceNumber.plus(1).toString()
  ),
  {
    timebounds: {
      minTime: Round1Time + TIMEOUT_CLAIM + TIMEOUT_CLAIM_DELAY,
      maxTime: 0,
    },
  }
)
  .addOperation(
    Operation.setOptions({
      signer: { ed25519PublicKey: BobKey, weight: 2 },
    })
  )
  .build()

// exchange signatures
Snapshot1Alice.sign(AliceRatchetKeypair)
Snapshot1Bob.sign(AliceRatchetKeypair)

Snapshot1Alice.sign(BobRatchetKeypair)
Snapshot1Bob.sign(BobRatchetKeypair)


const Ratchet1Bob = new TransactionBuilder(
  new Account(BobVersion.accountId(), BobVersion.sequenceNumber()),
  { timebounds: { minTime: Round1Time, maxTime: Round1Time + TIMEOUT_CLAIM } }
)
  .addOperation(
    Operation.BumpSequence({
      sourceAccount: RatchetKey,
      target: Ratchet1SequenceNumber.minus(1).toString(),
    })
  )
  .build()

const Ratchet1Alice = new TransactionBuilder(
  new Account(AliceVersion.accountId(), AliceVersion.sequenceNumber()),
  { timebounds: { minTime: Round1Time, maxTime: Round1Time + TIMEOUT_CLAIM } }
)
  .addOperation(
    (Operation as any).BumpSequence({
      sourceAccount: RatchetKey,
      target: Ratchet1SequenceNumber.minus(1).toString(),
    })
  )
  .build()

Ratchet1Bob.sign(AliceRatchetKeypair)
Ratchet1Alice.sign(BobRatchetKeypair)
