const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { generateToken, authenticateToken } = require('./jwt-token');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://praveen123:praveen123@cluster0.7oueg4l.mongodb.net/?retryWrites=true&w=majority')
    .then(() => {
        console.log("DB Connected..!");
    })
    .catch(error => {
        console.error('DB connection error:', error);
    });

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model('User', userSchema);

const todoSchema = new mongoose.Schema({
    userId: mongoose.Types.ObjectId,
    title: String,
    description: String,
    isFavorite: Boolean
});

const Todo = mongoose.model('Todo', todoSchema);


app.post('/signup', async (req, res) => {
    try {
        const user = new User({
            username: req.body.username,
            password: req.body.password 
        });
        await user.save();
        res.status(201).send('User created successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


app.post('/signin', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) return res.status(404).send('User not found');

        if (req.body.password === user.password) { 
            const accessToken = generateToken(user);
            res.json({ accessToken });
        } else {
            res.status(401).send('Authentication failed');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


app.post('/todos', authenticateToken, async (req, res) => {
    try {
        const todo = new Todo({
            userId: req.user._id,
            title: req.body.title,
            description: req.body.description,
            isFavorite: req.body.isFavorite || false
        });
        await todo.save();
        res.status(201).send('Todo created successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


app.put('/todos/:id', authenticateToken, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) return res.status(404).send('Todo not found');
        if (String(todo.userId) !== String(req.user._id)) return res.status(403).send('Forbidden');

        todo.title = req.body.title || todo.title;
        todo.description = req.body.description || todo.description;
        todo.isFavorite = req.body.isFavorite !== undefined ? req.body.isFavorite : todo.isFavorite;
        await todo.save();
        res.send('Todo updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


app.delete('/todos/:id', authenticateToken, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) return res.status(404).send('Todo not found');
        if (String(todo.userId) !== String(req.user._id)) return res.status(403).send('Forbidden');

        await todo.remove();
        res.send('Todo deleted successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


app.get('/todos', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const todos = await Todo.find({ userId: req.user._id }).skip(skip).limit(limit);
        res.json(todos);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


app.get('/todos/:id', authenticateToken, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) return res.status(404).send('Todo not found');
        if (String(todo.userId) !== String(req.user._id)) return res.status(403).send('Forbidden');

        res.json(todo);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


app.get('/search', authenticateToken, async (req, res) => {
    try {
        const query = req.query.q;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const todos = await Todo.find({ 
            userId: req.user._id, 
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ] 
        }).skip(skip).limit(limit);
        res.json(todos);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

const PORT = 3599;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
