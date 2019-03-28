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
const TIMEOUT_CLAIM_DELAY = moment.setup(1, 'week').seconds()

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


exports.step1 = async ctx => {

	const Alice = await server.loadAccount(AliceKeypair.publicKey())
	const Bob = await server.loadAccount(BobKey)

	console.log("Alice.publicKey is " + AliceKey);
	console.log("Bob.publicKey is " + BobKey);
	console.log();
	console.log("Also, AliceVersionKey, AliceRatchetKey, BobVersionKey, BobRatchetKey are generated");

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

		console.log(Alice.balances);
		console.log(Bob.balances);
		console.log(AliceVersion.balances);
		console.log(BobVersion.balances);
		console.log(Ratchet.balances);
		console.log("====== ====== ====== ====== ======")

	const fundingTx = new TransactionBuilder(Ratchet, {fee:100})
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
	.setTimeout(1000)
	.build()

	fundingTx.sign(AliceKeypair)
	fundingTx.sign(BobKeypair)
	fundingTx.sign(AliceRatchetKeypair)

	await server.submitTransaction(fundingTx)

	console.log(Alice.balances);
	console.log(Bob.balances);
	console.log(AliceVersion.balances);
	console.log(BobVersion.balances);
	console.log(Ratchet.balances);
	console.log("====== ====== ====== ====== ======")

	const Ratchet1SequenceNumber = Ratchet0SequenceNumber.plus(3)
	const Ratchet1Account = new Account(
	  Ratchet.accountId(),
	  Ratchet1SequenceNumber.toString()
	)

	const Round1Time = moment().unix()

	const Snapshot1Alice = new TransactionBuilder(
	  new Account(RatchetAccountId, Ratchet1SequenceNumber.toString()),
	  {
		fee: 100,
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
		  amount: '500',
		})
	  )
	  .setTimeout(1000)
	  .build()

	const Snapshot1Bob = new TransactionBuilder(
	  new Account(
		RatchetAccountId,
		Ratchet1SequenceNumber.plus(1).toString()
	  ),
	  {
		fee: 100,
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
	  .setTimeout(1000)
	  .build()

	// exchange signatures
	Snapshot1Alice.sign(AliceRatchetKeypair)
	Snapshot1Bob.sign(AliceRatchetKeypair)

	Snapshot1Alice.sign(BobRatchetKeypair)
	Snapshot1Bob.sign(BobRatchetKeypair)

	console.log(Alice.balances);
	console.log(Bob.balances);
	console.log(AliceVersion.balances);
	console.log(BobVersion.balances);
	console.log("Ratchet AccountId 最近余额：https://horizon-testnet.stellar.org/accounts/" + RatchetAccountId + "/");
	console.log("====== ====== ====== ====== ======")

	await ctx.render('stellar/step6')
}
