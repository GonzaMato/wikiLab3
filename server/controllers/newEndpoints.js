const express = require('express')
const {put} = require('axios')
const router = express.Router()

const GITHUB_TOKEN = process.env.GITHUB_TOKEN // Store your GitHub personal access token here
const GITHUB_REPO = process.env.GITHUB_REPO // Store the repo in the format: "username/repo"
const GITHUB_BRANCH = 'main'

const pushToGithub = async (filePath, content) => {
  const encodedContent = Buffer.from(content).toString('base64')
  const fileUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`

  try {
    const response = await put(
      fileUrl,
      {
        message: `Creating new page: ${filePath}`,
        content: encodedContent,
        branch: GITHUB_BRANCH
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  } catch (error) {
    console.error('Error pushing to GitHub:', error.response.data)
    throw new Error('Failed to push HTML to GitHub')
  }
}

// Example POST endpoint
router.post('/new/page', async (req, res, next) => {
  const {title, category, description, author, publishDate, country, url} = req.body

  if (!title || !category || !description || !author || !publishDate || !country || !url) {
    return res.status(400).json({message: 'Missing required fields'})
  }

  try {
    // Generate HTML content using the input
    const htmlContent = generateHtml(title, category, description, author, publishDate, country, url)

    // Define the file path where the HTML will be pushed in the repo
    const filePath = `pages/${title.replace(/\s+/g, '-').toLowerCase()}.html`

    // Push the HTML to GitHub
    const result = await pushToGithub(filePath, htmlContent)

    // Respond to the client
    res.status(201).json({message: 'HTML file created and pushed to GitHub', result})
  } catch (error) {
    console.error('Error in POST /create-html:', error)
    res.status(500).json({message: 'Failed to create and push HTML file'})
  }
})

const generateHtml = (title, category, description, author, publishDate, country, url) => {
  const currentDate = new Date().toISOString()
  const categoryList = category.join(', ')

  // Metadata block
  const metadata = `
<!--
title: ${title}
description: ${description}
published: true
date: ${currentDate}
tags: ${categoryList}
editor: code
dateCreated: ${currentDate}
-->
  `

  // HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="${description}">
        <title>${title}</title>
    </head>
    <body>
        <h1>${title}</h1>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Category:</strong> ${categoryList}</p>
        <p><strong>Author:</strong> ${author}</p>
        <p><strong>Publish Date:</strong> ${publishDate}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>URL:</strong> <a href="${url}" target="_blank">${url}</a></p>
    </body>
    </html>
  `

  return metadata + htmlContent
}

module.exports = router
