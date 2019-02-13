// global flag to easily tell if we're logged in
let LOGGED_IN = false;

// global storyList variable
let storyList;

// global user variable
let user;

// let's see if we're logged in
let token = localStorage.getItem("token");
let username = localStorage.getItem("username");

if (token && username) {
  LOGGED_IN = true;
}

$(document).ready(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navCreate = $("#nav-create");
  const $navFavorites = $("#nav-favorites");
  const $navOwnStories = $("#nav-own-stories");
  const $createStoryBtn =$("#create-story-submit-button");
  const $favArticles = $("#favorited-articles");

  // if there is a token in localStorage, call User.stayLoggedIn
  //  to get an instance of User with the right details
  //  this is designed to run once, on page load
  if (LOGGED_IN) {
    const userInstance = await User.stayLoggedIn();
    // we've got a user instance now
    user = userInstance;

    // let's build out some stories
    await generateStories();

    // and then display the navigation
    showNavForLoggedInUser();
  } else {
    // we're not logged in, let's just generate stories and stop there
    await generateStories();
  }

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */
  $loginForm.on("submit", async function(e) {
    e.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    user = userInstance;
    LOGGED_IN = true;
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */
  $createAccountForm.on("submit", async function(e) {
    e.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    user = newUser;
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */
  $navLogOut.on("click", function(e) {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */
  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   * We save on the number of API requests that we make. This is about 1/3 of the work that needs to be done bc it's only getting the generateStories() function
   */
  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * A rendering function to run to reset the forms and hide the login info
   */
  async function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();
    await generateStories();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance.
   *  Then render it
   */
  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    storyList.stories.forEach(function(story) {
      let result;

      if(LOGGED_IN){
        if(user.checkFavorited(story)){
          result = generateFavoritedHTML(story); 
        }
        else{
          result = generateLoggedInHTML(story);
        }  
      }
      else{
        result = generateStoryHTML(story);
      }


      //append remove button to only owr button
      if(LOGGED_IN){
        if(user.checkIfItsOwn(story)){
        result.append("<i class='far fa-trash-alt'></i>")
        }
      }

      $allStoriesList.append(result);   
    });
  }
 
  // create HTML for unfavorited story 
  function generateLoggedInHTML(story){
    let storyMarkup = generateStoryHTML(story, "far fa-star");
    return storyMarkup;
  }

  // create HTML for favorited story
  function generateFavoritedHTML(story){
    let storyMarkup = generateStoryHTML(story, "fas fa-star");
    return storyMarkup;
  } 
  
  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story, showFavorited = "") {
    let hostName = getHostName(story.url);
    // render story markup
    const storyMarkup = $(
      `<li id="${story.storyId}">
          <i class='${showFavorited}'></i>
          <a class="article-link" href="${story.url}" target="a_blank">
            <strong>${story.title}</strong>
           </a>
          <small class="article-author">by ${story.author}</small>
          <small class="article-hostname ${hostName}">(${hostName})</small>
          <small class="article-username">posted by ${story.username}</small>
        </li>`
    );

    return storyMarkup;
  }

  // hide all elements in elementsArr
  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach(val => val.hide());
  }

  /**everything we want to happen in the UI when the user logs in */
  function showNavForLoggedInUser() {
    //We have to declare $star variable here because it is being made by the JS and cant be delcared when the page loads
    $navLogin.hide();
    $navLogOut.show();
    $navCreate.show();
    $navFavorites.show();
  }

  // simple function to pull the hostname from a URL
  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }


  // Toggle functionality
  $navCreate.on("click", function() {
    // Show the create story Forms
    $submitForm.slideToggle();
  });

// '#create-story-submit-button'

/** This function is triggered when the form is submitted with new story details.
 * it calls the API 
 * gets a response
 * appends the story to the dom
 * and hides the form section
 */
  $submitForm.on('submit', async function(evt) {

    evt.preventDefault();

    let author = $("#author").val();
    let title = $("#title").val();
    let url = $('#url').val();
    let storyObj = {author, title, url};
    let token = user.loginToken;

    let newStory = await storyList.addStory(user, storyObj);

    $submitForm.slideToggle();

    let current = await $.get(`https://hack-or-snooze-v2.herokuapp.com/users/${user.username}`, {token})
    const userInstance = await User.stayLoggedIn();
    user = userInstance;

    await generateStories();

  })

  // Creating a helper function to add a single story to the DOM when a user creates a story so they can see it right away
    function appendStory(storyHTML, section = $allStoriesList) {
      const result = generateStoryHTML(storyHTML);
      section.append(result);
    }

    async function toggleFavoriteDOM(evt){
      let storyId = evt.target.parentElement.id;

      if($(evt.target).hasClass("far")){
        await user.addFavorite(storyId); 
      }
      else{
        await user.removeFavorite(storyId);
      } 
      
      $(evt.target).toggleClass("far fas");
    }
  
    $allStoriesList.on("click", ".fa-star", await toggleFavoriteDOM);
    $favArticles.on("click", ".fa-star", await toggleFavoriteDOM);


    $navFavorites.on("click", async function() {

      $favArticles.empty();

      $allStoriesList.toggle();
      $favArticles.toggle();
      let token = user.loginToken;
      let current = await $.get(`https://hack-or-snooze-v2.herokuapp.com/users/${user.username}`, {token})
      const userInstance = await User.stayLoggedIn();
      user = userInstance;

      for (let story of current.user.favorites) {
        let result = generateFavoritedHTML(story);
        $favArticles.append(result);
      }
      await generateStories();
    })

    // if clicked on remove, call removeStory
    // takes care of DOM and UI
    $allStoriesList.on("click", ".far.fa-trash-alt" ,async function(evt){
      let storyID = evt.target.parentElement.id;

      await storyList.removeStory(user, storyID);

      await generateStories();

    });

});

