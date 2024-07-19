"use strict";

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { Story } = require("inkjs");
const cors = require("cors");
const { strict } = require("assert");

const app = express();
const port = 3000;

// Set up multer for file upload
const upload = multer({ dest: "uploads/" });

// Function to log memory usage
const logMemoryUsage = () => {
  const used = process.memoryUsage();
  console.log("Memory usage:");
  for (let key in used) {
    console.log(
      `  ${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`
    );
  }
};

let aaa = 0;
// Function to process JSON content
const recursionDFS = (story) => {
  while (story.canContinue) {
    let line = story.Continue();
    // console.log(line);
    // console.log(story.state.currentPathString);
  }
  const backUpJson = story.state.toJson();
  for (let i = 0; i < story.currentChoices.length; i++) {
    let choice = story.currentChoices[i];
    story.ChooseChoiceIndex(choice.index);
    recursionDFS(story);
    story.state.LoadJson(backUpJson);
  }
  if (story.currentChoices.length == 0) {
    console.log(++aaa);
    // console.log(story.currentText);
    if (aaa % 1000 == 0) logMemoryUsage();
  }
};

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// API to upload a JSON file
app.post("/upload", upload.single("file"), (req, res) => {
  const filePath = path.join(__dirname, req.file.path);

  // Read the JSON file
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Error reading file");
    }

    // Parse the JSON content
    try {
      const inkJson = JSON.parse(data.replace(/^\uFEFF/, ""));
      const story = new Story(inkJson);
      console.time("dfsTraversal");
      recursionDFS(story);
      console.timeEnd("dfsTraversal");

      res.send("File processed successfully");
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(400).send("Invalid JSON format");
    } finally {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting file:", unlinkErr);
        }
      });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
