const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// const corsConfig = {
//   origin: [
//     'http://localhost:5173',
//     'https://my-book-sphere.web.app',
//     'https://my-book-sphere.firebaseapp.com'
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE']
// }
// app.use(cors(corsConfig));
// app.options("", cors(corsConfig));

// middleware
// app.use(cors());
// app.use(express.json());
// app.use(cookieParser());

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://my-book-sphere.web.app',
    'https://my-book-sphere.firebaseapp.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.MONGODB_ELEVEN_USER}:${process.env.MONGODB_ELEVEN_PASS}@cluster0.esbrpdb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


//localhost:5000 and localhost:5173 are treated as same site.  so sameSite value must be strict in development server.  in production sameSite will be none
// in development server secure will false .  in production secure will be true
const cookieOptions = {
  httpOnly: true,
  // secure: process.env.NODE_ENV === "production",
  secure: true,
  sameSite: 'none'
  // sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'not authorized' })
  }
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, decoded) => {
    // ------ error
    if (err) {
      return res.status(401).send({ message: 'this is not authorized' })
    }
    // ----- if token is valid then it would be decoded
    console.log('value in the token', decoded)
    req.user = decoded;
    next()
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    //creating Token
    // app.post("/jwt", logger, async (req, res) => {
    //   const user = req.body;
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    //   res.cookie("token", token, cookieOptions).send({ success: true });
    // });

    //--------- creating Token
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '5h' });

      res.cookie('token', token, cookieOptions).send({ success: true })
    })


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


    const bookCollection = client.db('bookSphereDB').collection('books');

    // --- send books
    app.get('/books', verifyToken, async (req, res) => {
      console.log(req.query);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
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

    // Update book - put
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

    // Update book - patch
    app.patch('/book/:bookId', async (req, res) => {
      const id = req.params.bookId;
      const filter = { _id: new ObjectId(id) }
      const updatedBook = req.body;

      const book = {
        $set: {
          quantity: updatedBook.quantity
        }
      }
      const result = await bookCollection.updateOne(filter, book);
      res.send(result);
    });


    const borrowCollection = client.db('bookSphereDB').collection('borrow');

    // --- send user
    app.get('/borrow', async (req, res) => {
      const cursor = borrowCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // --- received user from client
    app.post('/borrow', async (req, res) => {
      const borrow = req.body;
      console.log(borrow);
      const result = await borrowCollection.insertOne(borrow);
      res.send(result);
    });

    // --- delete borrow from client
    app.delete('/borrow/:borrowId', async (req, res) => {
      const id = req.params.borrowId;
      const query = { _id: new ObjectId(id) }
      const result = await borrowCollection.deleteOne(query);
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
