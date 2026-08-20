const contract_address = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
let current_account;
let web3;
let contract;

document.addEventListener("DOMContentLoaded", () => {
    const connection_btn = document.getElementById("connection_btn");
    if(connection_btn) connection_btn.addEventListener("click", connectWallet);

    const makePost_btn = document.getElementById("makePost_btn");
    if(makePost_btn) makePost_btn.addEventListener("click", makePost);

    const getPosts_btn = document.getElementById("getPosts_btn");
    if(getPosts_btn) getPosts_btn.addEventListener("click", getPosts);

    const filterAuthor_btn = document.getElementById("filterAuthor_btn");
    if(filterAuthor_btn) filterAuthor_btn.addEventListener("click", getPostsByAuthor);

    const resetFilter_btn = document.getElementById("resetFilter_btn");
    if(resetFilter_btn) resetFilter_btn.addEventListener("click", getPosts);

    if(window.ethereum) {
        web3 = new Web3(window.ethereum);
        contract = new web3.eth.Contract(abi, contract_address);

        window.ethereum.on("accountsChanged", (accounts) => {
            if(accounts.length === 0) {
                alert("Account not found");
                return;
            }
            current_account = accounts[0];
            enterToDapp();
            getPosts();
        });

        contract.events.PostCreated({fromBlock: "latest"}).on("data", async () => await getPosts());
        contract.events.PostDeleted({fromBlock: "latest"}).on("data", async () => await getPosts());
        contract.events.PostLiked({fromBlock: "latest"}).on("data", async () => await getPosts());

    } else alert("Please install web3 provider");
});

const connectWallet = async (e) => {
    if(window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            if(!accounts || accounts.length === 0){
                alert("Account not found");
                return;
            }
            current_account = accounts[0];
            enterToDapp();
            e.target.hidden = true;
            await getPosts();
        } catch(error) {
            alert("Connect to DApp error. See logs");
            console.error("Connect error", error);
        }
    } else alert("Please install web3 provider");
};

const enterToDapp = () => {
    const account_lbl = document.getElementById("account_lbl");
    if(account_lbl) {
        account_lbl.hidden = false;
        account_lbl.textContent = `Connected: ${current_account}`;
    }
    const dapp = document.getElementById("dapp");
    if(dapp) dapp.hidden = false;
};

const makePost = async () => {
    try {
        const post_text = document.getElementById("post_text");
        if(!post_text) throw new Error("Post text area not found");

        const message = post_text.value.trim();
        if(!message) return alert("Post text empty. Please type something");

        await contract.methods.create_post(message).send({ from: current_account });
        post_text.value = "";
    } catch(error) {
        alert("Make post error. See logs");
        console.error("Make post error: ", error);
    }
};

const getPosts = async () => {
    try {
        const posts = await contract.methods.get_posts().call();
        await renderPosts(posts);
    } catch(error) {
        alert("Get posts error. See logs");
        console.error("Get posts error: ", error);
    }
};

const getPostsByAuthor = async () => {
    try {
        const authorInput = document.getElementById("author_filter_input");
        const author = authorInput.value.trim();
        if(!web3.utils.isAddress(author)) return alert("Invalid ETH Address");

        const posts = await contract.methods.get_postByAuthor(author).call();
        await renderPosts(posts);
    } catch(error) {
        alert("Filter error. See logs");
        console.error("Filter error: ", error);
    }
};

const toggleLike = async (postId) => {
    try {
        await contract.methods.toggle_like(postId).send({ from: current_account });
    } catch(error) {
        console.error("Like error: ", error);
    }
};

const deletePost = async (postId) => {
    try {
        await contract.methods.delete_post(postId).send({ from: current_account });
    } catch(error) {
        console.error("Delete error: ", error);
    }
};

const renderPosts = async (posts) => {
    const posts_container = document.getElementById("posts");
    if(!posts_container) return;

    posts_container.innerHTML = "";

    const activePosts = posts.filter(p => !p.isDeleted);

    if(activePosts.length === 0) {
        posts_container.innerHTML = "<p>No posts found.</p>";
        return;
    }

    for (const post of activePosts) {
        const isUserLiked = current_account 
            ? await contract.methods.hasLiked(post.id, current_account).call() 
            : false;

        const card = document.createElement("div");
        card.className = "post-card";

        const isAuthor = current_account && post.author.toLowerCase() === current_account.toLowerCase();

        card.innerHTML = `
            <div class="post-header">
                <span class="author">${post.author}</span>
                <span class="date">${new Date(Number(post.timestamp) * 1000).toLocaleString()}</span>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-actions">
                <button class="like-btn ${isUserLiked ? 'liked' : ''}" data-id="${post.id}">
                    ❤️ ${post.likes}
                </button>
                ${isAuthor ? `<button class="delete-btn" data-id="${post.id}">Delete</button>` : ''}
            </div>
        `;

        card.querySelector(".like-btn").addEventListener("click", () => toggleLike(post.id));
        if(isAuthor) {
            card.querySelector(".delete-btn").addEventListener("click", () => deletePost(post.id));
        }

        posts_container.appendChild(card);
    }
};