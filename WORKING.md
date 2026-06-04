This is how the app must work. This encompasses all the features and I have manually added these:

1. The app has a frontend and a backend.

- The frontend will be hosted on my nvombat.github.io website under its own tab
- The frontend code will be in this repo
- The backend will be hosted on railway (will do it in a bit)
- The backend code will be shifted to another repo (as keeping it in this repo is giving issues with github pages) - FOR THIS PLEASE CREATE A DOCUMENT called BACKEND.md which gives instructions step by step on how to shift the backend code to a new repo such that both this website and the backend will work once I host the backend

- Whenever a user comes to the tab, they should be able to make an entry
- The form will take their email, name, username, and then choice of 8 teams
- Double check that the 48 teams shown in the drop down menu are the 48 currently playing in this world cup
- We are using the email to ensure that duplicate entries are not allowed
- The username field MUST also be unique and not allow duplicate entries
- Every entry a user makes will get them a confirmation email (essentially a user can make multiple entries with different emails and user names but that means they have entered the competition twice (500 per entry))
- The countdown timer is to the start of the world cup
- Until the world cup starts a user can make as many entries AND will not be able to see any other entries of other participants or their own other entries
- Once the world cup starts (the countdown finishes), If the user comes to that site, THE FORM SHOULD NO LONGER BE THERE and will not take any more entries.
- The user will now see a leaderboard page as the form has been disabled.
- Be creative with the leaderboard page and ensure that it is not tacky.
- On this leaderboard will be all the entrants along with their username and scores
- A user can click on any user name to see the predictions made by a player.
- There will be tick, cross or question mark near every prediction to show whether it was correct wrong or not yet taken place
- The backend database (MySQL) will store all the entries
- The backend will calculate the scores based on the updated results
- The admin should be able to update the results per stage (round of 32, round of 16, ... finals...)
