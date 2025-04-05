let token = localStorage.getItem("authToken");

document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.querySelector("#register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      register();
    });
  }

  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      login();
    });
  }

  // User registered message
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("registered")) {
    const messageDiv = document.createElement("div");
    messageDiv.textContent = "User registered successfully";
    messageDiv.className = "text-green-600 text-center mt-4";

    const signInHeader = document.querySelector("h2.text-center");
    if (signInHeader) {
      signInHeader.insertAdjacentElement("afterend", messageDiv);
    }

    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }

  // Handle post creation
  const publishBtn = document.getElementById("publish-btn");
  if (publishBtn) {
    publishBtn.addEventListener("click", function (event) {
      event.preventDefault();
      createPost();
    });
  }

  // Handle post filtering
  const allPostsBtn = document.querySelector(".allPosts-btn");
  if (allPostsBtn) {
    allPostsBtn.addEventListener("click", function () {
      filterPosts("all");
    });
  }

  const myPostsBtn = document.querySelector(".myPosts-btn");
  if (myPostsBtn) {
    myPostsBtn.addEventListener("click", function () {
      filterPosts("myPosts");
    });
  }

  // Load posts on dashboard load
  if (window.location.pathname.includes("dashboard.html")) {
    loadPosts();
  }

  // Handle logout
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", function (event) {
      event.preventDefault();
      logout();
    });
  }
});

// Register
function register() {
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!usernameInput || !emailInput || !passwordInput) {
    console.error(
      "Register form elements not found. Make sure you are on the register page."
    );
    return;
  }

  const username = usernameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;

  fetch("https://blog-app-a1a9.onrender.com/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.errors) {
        alert(data.errors[0].message);
      } else {
        window.location.href = "login.html?registered=true";
      }
    })
    .catch((error) => {
      console.log("Registration error:", error);
    });
}

// Login
function login() {
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");

  if (!emailInput || !passwordInput) {
    console.error("Login form elements not found");
    return;
  }

  const email = emailInput.value;
  const password = passwordInput.value;

  fetch("https://blog-app-a1a9.onrender.com/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.token) {
        localStorage.setItem("authToken", data.token);
        window.location.href = "dashboard.html";
      } else {
        alert(data.message);
      }
    })
    .catch((error) => {
      console.log("Login error:", error);
    });
}

// Logout
function logout() {
  fetch("https://blog-app-a1a9.onrender.com/api/users/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (res.ok) {
        localStorage.removeItem("authToken");
        token = null;
        window.location.href = "index.html";
      } else {
        return res.json().then((data) => {
          throw new Error(data.message || "Logout failed");
        });
      }
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
}

// Create Post
function createPost() {
  const title = document.getElementById("title").value;
  const content = document.getElementById("story").value;
  const category = document.getElementById("category-dropdown").value;

  const decodedToken = jwt_decode(token);
  const postedBy = decodedToken.data.email;

  const postData = {
    title,
    content,
    category,
    postedBy,
  };

  fetch("https://blog-app-a1a9.onrender.com/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
      } else {
        window.location.href = "dashboard.html";
      }
    })
    .catch((error) => {
      console.error("Error creating post:", error);
    });
}

// Load posts
async function loadPosts(filter = "all") {
  try {
    const postsResponse = await fetch(
      "https://blog-app-a1a9.onrender.com/api/posts",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    let posts = await postsResponse.json();

    const usersResponse = await fetch(
      "https://blog-app-a1a9.onrender.com/api/users",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const users = await usersResponse.json();

    const postsContainer = document.getElementById("postsContainer");
    postsContainer.innerHTML = "";

    if (filter === "myPosts") {
      const decodedToken = jwt_decode(token);
      const userEmail = decodedToken.data.email;
      posts = posts.filter((post) => post.postedBy === userEmail);
    }

    posts.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return b.id - a.id;
      }
    });

    console.log("Sorted Posts:", posts);

    // Render posts
    posts.forEach((post) => {
      const user = users.find((user) => user.email === post.postedBy);
      const username = user ? user.username : post.postedBy;

      // Ensure createdAt is a valid date
      const postDate = post.createdAt ? new Date(post.createdAt) : new Date();
      const formattedDate = postDate.toLocaleString();

      const postElement = document.createElement("div");
      postElement.className =
        "post bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-full break-words";
      postElement.innerHTML = `
        <h3 class="text-xl font-bold">${post.title}</h3>
        <p class="text-gray-700">${post.content}</p>
        <p class="text-gray-500 text-sm">Posted by: ${username}</p>
        <p class="text-gray-500 text-sm">Posted on: ${formattedDate}</p>
      `;

      const decodedToken = jwt_decode(token);
      if (post.postedBy === decodedToken.data.email) {
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "flex space-x-2 mt-2";

        const updateButton = document.createElement("button");
        updateButton.className =
          "px-4 py-2 text-gray-900 rounded-lg dark:text-white group";
        updateButton.innerHTML = `<i class="fas fa-edit"></i> Update`;
        updateButton.addEventListener("click", () => {
          showUpdateModal(post);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className =
          "px-4 py-2 text-gray-900 rounded-lg dark:text-white group";
        deleteButton.innerHTML = `<i class="fas fa-trash"></i> Delete`;
        deleteButton.addEventListener("click", () => {
          showDeleteModal(post.id);
        });

        buttonContainer.appendChild(updateButton);
        buttonContainer.appendChild(deleteButton);
        postElement.appendChild(buttonContainer);
      }

      postsContainer.appendChild(postElement);
    });

    postsContainer.style.overflowY = "auto";
    postsContainer.style.overflowX = "hidden";
    postsContainer.style.maxHeight = "80vh";
    postsContainer.style.scrollbarWidth = "none";
    postsContainer.style.msOverflowStyle = "none";
  } catch (error) {
    console.error("Error loading posts:", error);
  }
}

// Show Update Modal
function showUpdateModal(post) {
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center";
  modal.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      <h3 class="text-xl font-bold mb-4">Update Post</h3>
      <input type="text" id="updateTitle" class="w-full p-2 border border-gray-300 rounded-lg mb-4" value="${post.title}" />
      <textarea id="updateContent" class="w-full p-2 border border-gray-300 rounded-lg mb-4">${post.content}</textarea>
      <div class="flex justify-end space-x-2">
        <button id="cancelUpdate" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
        <button id="submitUpdate" class="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600">Update</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const cancelUpdate = modal.querySelector("#cancelUpdate");
  cancelUpdate.addEventListener("click", () => {
    modal.remove();
  });

  const submitUpdate = modal.querySelector("#submitUpdate");
  submitUpdate.addEventListener("click", () => {
    const newTitle = modal.querySelector("#updateTitle").value;
    const newContent = modal.querySelector("#updateContent").value;

    if (newTitle && newContent) {
      updatePost(post.id, newTitle, newContent);
      modal.remove();
    }
  });
}

// Show Delete Modal
function showDeleteModal(postId) {
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center";
  modal.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      <h3 class="text-xl font-bold mb-4">Delete Post</h3>
      <p class="mb-4">Are you sure you want to delete this post?</p>
      <div class="flex justify-end space-x-2">
        <button id="cancelDelete" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
        <button id="confirmDelete" class="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const cancelDelete = modal.querySelector("#cancelDelete");
  cancelDelete.addEventListener("click", () => {
    modal.remove();
  });

  const confirmDelete = modal.querySelector("#confirmDelete");
  confirmDelete.addEventListener("click", () => {
    deletePost(postId);
    modal.remove();
  });
}

// Update Post
function updatePost(postId, newTitle, newContent) {
  fetch(`https://blog-app-a1a9.onrender.com/api/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title: newTitle, content: newContent }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
      } else {
        loadPosts();
      }
    })
    .catch((error) => {
      console.error("Error updating post:", error);
    });
}

// Delete Post
function deletePost(postId) {
  fetch(`https://blog-app-a1a9.onrender.com/api/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
      } else {
        loadPosts();
      }
    })
    .catch((error) => {
      console.error("Error deleting post:", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const postsContainer = document.getElementById("postsContainer");
  postsContainer.style.cssText += "::-webkit-scrollbar { display: none; }";
});

// Filter Posts
function filterPosts(filter) {
  loadPosts(filter);
}
