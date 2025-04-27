// Handle user signup
const signupForm = document.querySelector("#signup-form");
signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;
  const email = document.querySelector("#email").value;
  try {
    // استخدام دالة signupUser من model.js
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(() => {
        const user = firebase.auth().currentUser;
        firebase.firestore().collection('users').doc(user.uid).set({
          username: username,
          email: email
        });
      });
    window.location.href = 'client_home.html'; // Redirect to client home after signup
  } catch (error) {
    console.error('Signup error: ', error);
  }
});

// Handle post job form submission
const postJobForm = document.querySelector("#post-job-form");
postJobForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = document.querySelector("#title").value;
  const description = document.querySelector("#description").value;
  const budget = document.querySelector("#budget").value;
  try {
    // استخدام دالة postJob من model.js
    const userId = firebase.auth().currentUser.uid;
    const newJobRef = firebase.firestore().collection('jobs').doc();
    newJobRef.set({
      title: title,
      description: description,
      budget: budget,
      clientId: userId,
      status: 'open',
      createdAt: new Date().toISOString()
    });
    alert('Job posted successfully!');
    window.location.href = 'client_view_offers.html'; // Redirect after posting job
  } catch (error) {
    console.error('Error posting job: ', error);
  }
});

// Handle fetching available jobs for courier
const jobsContainer = document.querySelector("#jobs-container");
window.addEventListener('load', async () => {
  try {
    // استخدام دالة fetchJobs من model.js
    const snapshot = await firebase.firestore().collection('jobs').where('status', '==', 'open').get();
    const jobs = [];
    snapshot.forEach((doc) => {
      jobs.push(doc.data());
    });
    jobsContainer.innerHTML = jobs.map(job => `<p>${job.title} - ${job.description}</p>`).join('');
  } catch (error) {
    console.error('Error fetching jobs: ', error);
  }
});