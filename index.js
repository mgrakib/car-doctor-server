/** @format */

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const {
	MongoClient,
	ServerApiVersion,
	ClientSession,
	ObjectId,
} = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const sarvices = require("./Data/services.json");

// pass =
// user = ;

app.use(cors());
app.use(express.json());
require("dotenv").config();
app.get("/", (req, res) => {
	res.send("server is running...");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nvffntx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

const verify = (req, res, next) => {
	const authorization = req.headers.authorizaion;
	if (!authorization) {
		return	res.send({error: true, message:"Unauthorized Access its"})
	}

	const token = authorization.split(' ')[1];
	jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) =>{
		if (err) {
			return res.send({error: true, message:'Unauthorized Access no seond'})
		}
		req.decoded = decoded
		next();
	});	
}

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();

		const database = client.db("carDoctor");
		const servicesCollection = database.collection("services");
		const bookedServiceCollection = database.collection("bookedService");


		app.post('/jwt', (req, res) => {
			const userEmail = req.body;
			const token = jwt.sign(userEmail, process.env.JWT_ACCESS_TOKEN, {
				expiresIn: "1h",
			});

			res.send({ token });
		})
		

		// get all services
		app.get("/services", async (req, res) => {
			const cursor = servicesCollection.find();
			const result = await cursor.toArray();
			res.send(result);
		});

		// get spacific service
		app.get("/services/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const options = {
				// Include only the `title` and `imdb` fields in the returned document
				projection: {
					_id: 1,
					title: 1,
					price: 1,
					img: 1,
					service_id: 1,
				},
			};
			const result = await servicesCollection.findOne(query, options);
			res.send(result);
		});

		// get data by token 
		app.get("/booking", verify,  async (req, res) => {
			
			let query = {};
			if (req.query?.email) {
				query = { email: req.query.email };
			}
			const result = await bookedServiceCollection.find(query).toArray();
			res.send(result);
		});

		// add booked service
		app.post("/booked-service/:id", async (req, res) => {
			const bookedServiceFromFrontEnd = req.body;
			const bookedService = {
				userName: bookedServiceFromFrontEnd.userName,
				date: bookedServiceFromFrontEnd.date,
				email: bookedServiceFromFrontEnd.email,
				time: bookedServiceFromFrontEnd.time,
				serviceImg: bookedServiceFromFrontEnd.serviceImg,
				price: bookedServiceFromFrontEnd.price,
				message: bookedServiceFromFrontEnd.message,
				servideId: bookedServiceFromFrontEnd.servideId,
				status: bookedServiceFromFrontEnd.status,
			};
			const result = await bookedServiceCollection.insertOne(
				bookedService
			);
			res.send(result);
		});

		// update
		app.patch("/booking/:id", async (req, res) => {
			const updateBooked = req.body;

			const id = req.params.id;
			const filter = { _id: new ObjectId(id) };
			// this option instructs the method to create a document if no documents match the filter

			// create a document that sets the plot of the movie
			const updateDoc = {
				$set: {
					status: updateBooked.status,
				},
			};

			const result = await bookedServiceCollection.updateOne(
				filter,
				updateDoc
			);
			res.send(result);
		});

		// delete
		app.delete("/delete-service/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await bookedServiceCollection.deleteOne(query);
			res.send(result);
		});

		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.listen(port, () => {
	console.log(`this server is running on ${port}`);
});
