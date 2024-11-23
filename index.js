require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 2400;

app.use(cors());
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Root route: Welcome message with login form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recipe Generator</title>
      <style>
        body {
          background-color: pink;
          font-family: Arial, sans-serif;
          text-align: center;
          margin: 0;
          padding: 0;
        }
        .container {
          padding: 20px;
        }
        h1 {
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        form {
          background: white;
          padding: 20px;
          border-radius: 10px;
          display: inline-block;
          margin-top: 20px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        input, button {
          margin: 10px;
          padding: 10px;
          border-radius: 5px;
          border: 1px solid #ccc;
          width: 90%;
        }
        button {
          background-color: #ff69b4;
          color: white;
          border: none;
          cursor: pointer;
        }
        button:hover {
          background-color: #ff1493;
        }
        a {
          color: #ff69b4;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to the Recipe Generator API</h1>
        <p>Log in below:</p>
        <form action="/login" method="POST">
          <label for="email">Email:</label><br>
          <input type="text" id="email" name="email" required><br>
          <label for="password">Password:</label><br>
          <input type="password" id="password" name="password" required><br><br>
          <button type="submit">Login</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Login route using Supabase Auth
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return res.status(400).send('Invalid email or password');
    }

    // Redirect to the recipe search page upon successful login
    res.redirect(`/search-recipe?user=${encodeURIComponent(email)}`);
  } catch (err) {
    res.status(500).send('Error logging in. Please try again.');
  }
});

// Recipe search page
app.get('/search-recipe', (req, res) => {
  const { user } = req.query;

  if (!user) {
    return res.status(400).send('Unauthorized access. Please log in.');
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recipe Search</title>
      <style>
        body {
          background-color: pink;
          font-family: Arial, sans-serif;
          text-align: center;
        }
        .container {
          padding: 20px;
        }
        h1 {
          color: white;
        }
        form {
          background: white;
          padding: 20px;
          border-radius: 10px;
          display: inline-block;
          margin-top: 20px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        input, button {
          margin: 10px;
          padding: 10px;
          border-radius: 5px;
          border: 1px solid #ccc;
          width: 90%;
        }
        button {
          background-color: #ff69b4;
          color: white;
          border: none;
          cursor: pointer;
        }
        button:hover {
          background-color: #ff1493;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome, ${user}</h1>
        <p>Search for a recipe:</p>
        <form action="/fetch-recipe" method="GET">
          <input type="hidden" name="user" value="${encodeURIComponent(user)}">
          <label for="recipeName">Recipe Name:</label><br>
          <input type="text" id="recipeName" name="recipeName" required><br><br>
          <button type="submit">Search Recipe</button>
        </form>
        <br><br>
        <a href="/">Logout</a>
      </div>
    </body>
    </html>
  `);
});

// Recipe fetching route
app.get('/fetch-recipe', async (req, res) => {
  const { recipeName, user } = req.query;

  if (!recipeName) {
    return res.status(400).send('Recipe name is required');
  }

  try {
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(recipeName)}`);
    if (response.data.meals) {
      const recipe = response.data.meals[0];
      res.send(`
        <div style="background-color: pink; font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1>${recipe.strMeal}</h1>
          <p><strong>Category:</strong> ${recipe.strCategory}</p>
          <p><strong>Instructions:</strong> ${recipe.strInstructions}</p>
          <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" style="width:300px;height:auto; border-radius: 10px;">
          <br><br>
          <a href="/search-recipe?user=${encodeURIComponent(user)}" style="color: white; text-decoration: none; padding: 10px 20px; background-color: #ff69b4; border-radius: 5px;">Search Another Recipe</a>
        </div>
      `);
    } else {
      res.send(`<h1>No recipes found</h1><a href="/search-recipe?user=${encodeURIComponent(user)}">Go Back</a>`);
    }
  } catch (error) {
    res.status(500).send('Error fetching recipe. Please try again later.');
  }
});

//start server
app.listen(port, () => {
  console.log(`Recipe Generator API is running on port ${port}`);
});
