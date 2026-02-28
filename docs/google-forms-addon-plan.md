
# 🚀 Quinfer: Google Forms Add-on Monetization & Protection Guide

This guide explains how to charge for your add-on using Gumroad Subscriptions and prevent license sharing.

## 💰 How Monetization Works (Subscription Model)
1.  **Create Subscription Product:** On [Gumroad](https://gumroad.com), create a new product and select "Subscription" as the type.
2.  **License Key Support:** Ensure "Generate unique license key per sale" is enabled in the product settings.
3.  **Activation Gate:** The first time a user enters a key in the sidebar, it calls `/api/license/activate`.
4.  **Enforced Access:** Quinfer checks if the subscription is active, hasn't failed payment, and isn't expired on every analysis.

---

## 1. Gumroad Setup
*   **Product ID:** Copy your product's "ID" (found in the product URL or settings).
*   **Max Uses:** Set "Max Uses" to 1 in Gumroad settings to prevent one key being used by multiple teachers.

---

## 2. Vercel Configuration
In your Vercel project, go to **Settings > Environment Variables** and add:
*   `GUMROAD_PRODUCT_ID`: Your unique product ID from Gumroad.
*   `GEMINI_API_KEY`: Your Google AI Studio key.

---

## 3. Google Apps Script Bridge (`Code.gs`)
Replace your script code with this version.

```javascript
/**
 * Quinfer: Insight Generator Add-on
 */

var BASE_URL = "https://quinfer-web-engine.vercel.app"; 

function onOpen(e) {
  FormApp.getUi()
      .createAddonMenu()
      .addItem('Generate Insights', 'showQuinferSidebar')
      .addToUi();
}

function showQuinferSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('sidebar')
      .setTitle('Quinfer Insights')
      .setWidth(300);
  FormApp.getUi().showSidebar(html);
}

// Save the license key for this user
function saveUserLicense(key) {
  PropertiesService.getUserProperties().setProperty('QUINFER_LICENSE', key);
}

function runAnalysis() {
  var form = FormApp.getActiveForm();
  var responses = form.getResponses();
  var items = form.getItems();
  var licenseKey = PropertiesService.getUserProperties().getProperty('QUINFER_LICENSE') || "";
  
  if (responses.length === 0) {
    throw new Error("No responses found. Please wait for students to submit.");
  }

  // Prepare Data
  var questions = items.map(function(item) {
    var type = item.getType().toString();
    var choices = [];
    if (type === "MULTIPLE_CHOICE") {
      choices = item.asMultipleChoiceItem().getChoices().map(function(c) { return c.getValue(); });
    }
    return { id: item.getId().toString(), title: item.getTitle(), type: type, choices: choices };
  });
  
  var studentData = responses.map(function(response) {
    return {
      studentName: response.getRespondentEmail() || "Student",
      answers: response.getItemResponses().map(function(answer) {
        return { questionId: answer.getItem().getId().toString(), answer: answer.getResponse() };
      })
    };
  });

  var payload = {
    assessmentTitle: form.getTitle(),
    questions: questions,
    responses: studentData,
    licenseKey: licenseKey
  };

  var options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  try {
    var response = UrlFetchApp.fetch(BASE_URL + '/api/google-forms/analyze', options);
    var content = response.getContentText();
    var result = JSON.parse(content);
    
    if (response.getResponseCode() !== 200) {
      throw new Error(result.message || "License/Server Error");
    }
    
    return result;
  } catch (e) {
    throw new Error(e.message);
  }
}
```

## 4. Sidebar Implementation (`sidebar.html`)
Use this HTML for your sidebar.

```html
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body { margin: 0; padding: 0; font-family: sans-serif; height: 100vh; }
      iframe { border: none; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="container">
      <p style="padding: 20px; text-align: center;">Preparing Quinfer Engine...</p>
    </div>

    <script>
      var BASE_URL = "https://quinfer-web-engine.vercel.app";

      function loadAnalysis() {
        google.script.run
          .withSuccessHandler(function(data) {
            var encodedData = btoa(JSON.stringify(data));
            document.getElementById('container').innerHTML = 
              '<iframe src="' + BASE_URL + '/insights/google-forms?data=' + encodedData + '"></iframe>';
          })
          .withFailureHandler(function(error) {
            var errorPayload = btoa(JSON.stringify({ success: false, message: error.message }));
            document.getElementById('container').innerHTML = 
              '<iframe src="' + BASE_URL + '/insights/google-forms?data=' + errorPayload + '"></iframe>';
          })
          .runAnalysis();
      }

      window.onload = loadAnalysis;
    </script>
  </body>
</html>
```
