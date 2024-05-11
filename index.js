const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const corsConfig = {
  origin: '',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}
app.use(cors(corsConfig))
app.options("", cors(corsConfig))

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGODB_ELEVEN_USER}:${process.env.MONGODB_ELEVEN_PASS}@cluster0.esbrpdb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const userCollection = client.db('bookSphereDB').collection('users');

    // --- send user
    app.get('/users', async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // --- received user from client
    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await userCollection.insertOne(user);
      res.send(result);
    });


    const librarianCollection = client.db('bookSphereDB').collection('librarian');
    
    // --- send user
    app.get('/librarians', async (req, res) => {
      const cursor = librarianCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // // --- send user
    // app.get('/librarians/:userUid', async (req, res) => {
    //   const id = req.params.userUid;
    //   const query = { userUid: new ObjectId(id) }
    //   const result = await librarianCollection.findOne(query);
    //   res.send(result);
    // });

    const bookCollection = client.db('bookSphereDB').collection('books');

    // --- send books
    app.get('/books', async (req, res) => {
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/book/:bookId', async (req, res) => {
      const id = req.params.bookId;
      const query = { _id: new ObjectId(id) }
      const result = await bookCollection.findOne(query);
      res.send(result);
    });

    // --- received books from client
    app.post('/books', async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await bookCollection.insertOne(item);
      res.send(result);
    });

    // --- delete book from client
    app.delete('/book/:bookId', async (req, res) => {
      const id = req.params.bookId;
      const query = { _id: new ObjectId(id) }
      const result = await bookCollection.deleteOne(query);
      res.send(result);
    });

    // Update book
    app.put('/book/:bookId', async (req, res) => {
      const id = req.params.bookId;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedBook = req.body;

      const book = {
        $set: {
          name: updatedBook.name,
          category: updatedBook.category,
          quantity: updatedBook.quantity,
          author: updatedBook.author,
          rating: updatedBook.rating,
          image: updatedBook.image,
          contents: updatedBook.contents,
          shortDescription: updatedBook.shortDescription
        }
      }
      const result = await bookCollection.updateOne(filter, book, options);
      res.send(result);
    });


    const categoryCollection = client.db('bookSphereDB').collection('category');

    // --- send user
    app.get('/category', async (req, res) => {
      const cursor = categoryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // --- received user from client
    app.post('/category', async (req, res) => {
      const category = req.body;
      console.log(category);
      const result = await categoryCollection.insertOne(category);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

// --- run server
app.get('/', (req, res) => {
  res.send('Server is running...')
});

app.listen(port, () => {
  console.log(`Server is running port: ${port}
  Link: http://localhost:${port}`);
});
