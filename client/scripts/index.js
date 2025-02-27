document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const bruteForceButton = document.getElementById("bruteForce");
  const fetchPostsButton = document.getElementById("fetchPosts"); // neuer Button
  const resultText = document.getElementById("result");
  const postsContainer = document.getElementById("posts");

  let jwtToken = null; // Variable zum Speichern des Tokens

  const login = async (username, password) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      jwtToken = data.token; // Token speichern
      resultText.insertAdjacentHTML("afterbegin", `Token: ${jwtToken}<br>`);
    } else {
      const errorMsg = await response.text();
      resultText.insertAdjacentHTML("afterbegin", errorMsg + "<br>");
    }
  };

  loginButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    await login(username, password);
  });

  bruteForceButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    while (true) {
      await login(username, password);
    }
  });

  // Neue Funktion: Abrufen und Anzeigen der Posts
  const fetchPosts = async () => {
    if (!jwtToken) {
      resultText.insertAdjacentHTML("afterbegin", "Bitte melden Sie sich zuerst an.<br>");
      return;
    }
    const response = await fetch("/api/posts", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + jwtToken,
      },
    });
    if (response.ok) {
      const posts = await response.json();
      // Vorherige Inhalte löschen
      postsContainer.innerHTML = "";
      posts.forEach((post) => {
        const postDiv = document.createElement("div");
        postDiv.className = "post p-4 bg-slate-600 rounded";
        postDiv.innerHTML = `<h2 class="font-bold">${post.title}</h2><p>${post.content}</p>`;
        postsContainer.appendChild(postDiv);
      });
    } else {
      const errorMsg = await response.text();
      resultText.insertAdjacentHTML("afterbegin", "Fehler beim Abrufen der Posts: " + errorMsg + "<br>");
    }
  };

  fetchPostsButton.addEventListener("click", fetchPosts);
});