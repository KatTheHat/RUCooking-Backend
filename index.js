require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 2400;

app.use(cors());
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Root route: Welcome message with login and recipe search forms
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to the Recipe Generator API</h1>
    <p>Log in below:</p>
    <form action="/login" method="POST">
      <label for="email">Email:</label><br>
      <input type="text" id="email" name="email" required><br>
      <label for="password">Password:</label><br>
      <input type="password" id="password" name="password" required><br><br>
      <button type="submit">Login</button>
    </form>
    <hr>
    <p>Search for a recipe:</p>
    <form action="/search-recipe" method="GET">
      <label for="recipeName">Recipe Name:</label><br>
      <input type="text" id="recipeName" name="recipeName" required><br><br>
      <button type="submit">Search Recipe</button>
    </form>
  `);
});

//login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  //check user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return res.status(400).send('Invalid email or password');
  }

  //password
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(400).send('Invalid email or password');
  }

  //token
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });

  res.send(`Login successful! Your token: ${token}`);
});

//recipe search
app.get('/search-recipe', async (req, res) => {
  const { recipeName } = req.query;

  if (!recipeName) {
    return res.status(400).send('Recipe name is required');
  }

  try {
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${recipeName}`);
    if (response.data.meals) {
      //load recipe
      const recipe = response.data.meals[0];
      res.send(`
        <h1>${recipe.strMeal}</h1>
        <p><strong>Category:</strong> ${recipe.strCategory}</p>
        <p><strong>Instructions:</strong> ${recipe.strInstructions}</p>
        <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" style="width:300px;height:auto;">
        <br><br>
        <a href="/">Go Back</a>
      `);
    } else {
      res.send('<h1>No recipes found</h1><a href="/">Go Back</a>');
    }
  } catch (error) {
    res.status(500).send('Error fetching recipe. Please try again later.');
  }
});

//start server
app.listen(port, () => {
  console.log(`Recipe Generator API is running on port ${port}`);
});
