const modal = document.getElementById("modal");
const input = document.getElementById("imageInput");
const preview = document.getElementById("preview");
let liveapi = "https://categoryapi-oluc.onrender.com/api/category";
let editId = null;
let currentpage = 1;
let limit = 4;

function openModal() {
  modal.style.display = "flex";
}
function resetfrom() {
  document.getElementById("Categoryname").value = "";
  document.getElementById("slug").value = "";
  document.getElementById("Description").value = "";
  document.getElementById("preview").style.display = "none";
  document.getElementById("saveBtn").innerText = "Save";
  editId = null;
}

async function closeModal() {
  const input = document.getElementById("imageInput");
  const Categoryname = document.getElementById("Categoryname").value;
  const slug = document.getElementById("slug").value;
  const Description = document.getElementById("Description").value;

  const formData = new FormData();

  if (input.files[0]) {
    formData.append("Img", input.files[0]);
  } // 🔥 file
  formData.append("Categoryname", Categoryname);
  formData.append("Slug", slug);
  formData.append("Description", Description);

  console.log("hyy");
  try {
    let url = `${liveapi}`;
    let method = "POST";

    // 🔥 EDIT MODE
    if (editId) {
      url += "/" + editId;
      method = "PATCH";
    }

    const res = await fetch(url, {
      method: method,
      body: formData,
    });
    const data = await res.json();
    console.log(data);
    if (res.ok) {
      dbdata();
      modal.style.display = "none";
      resetfrom();
    }
  } catch (error) {
    console.error(error);
  }
}
window.onload = dbdata;
//get data

async function dbdata() {
  const showdata = document.getElementById("showdata");
  //const res = await fetch(`${liveapi}`);
  const res = await fetch(`${liveapi}?page=${currentpage}&limit${limit}`);
  const data = await res.json();
  showdata.innerHTML = " ";

  const realData = data.data;
  realData.forEach((item) => {
    console.log(item);
    showdata.innerHTML += `
            <tr>
    <td><img src="${item.Img}"  width="50px" height="50px" alt="img"/></td>
    <td>${item.Categoryname}</td>
    <td>${item.Slug}</td>
    <td>${item.Description}</td>
    <td><button class="edit-btn"   onclick="updateCategory('${item._id}')">Edit</button></td>
    <td> <button class="delete-btn" onclick="deleteCategory('${item._id}')">
    Delete
  </button></td>
  </tr>
        `;
  });
  renderPagination(data.totalPages);
}

// renderpagination

function renderPagination(totalPages) {
  let html = " ";

  // Prev
  if (currentpage > 1) {
    html += `<button class="changepage" onclick="changePage(${currentpage - 1})">Prev</button>`;
  }

  // Numbers
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button 
      class="changepage"
      style="${i === currentpage ? "background:#2563eb;color:white;" : ""}"
      onclick="changePage(${i})">
      ${i}
      </button>
    `;
  }
  // Next
  if (currentpage < totalPages) {
    html += `<button  class="changepage" onclick="changePage(${currentpage + 1})">Next</button>`;
  }

  document.getElementById("pagination").innerHTML = html;
}
//page change function
function changePage(page) {
  currentpage = page;
  dbdata();
}
//delete
async function deleteCategory(_id) {
  try {
    console.log(_id);
    const res = await fetch(`${liveapi}/${_id}`, {
      method: "delete",
    });

    const data = await res.json();
    if (res.ok) {
      alert("Deleted successfully ✅");
      dbdata(); // page refresh
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.log("DELETE ERROR:", error);
  }
}
//update
async function updateCategory(_id) {
  try {
    // 🔥 button change

    editId = _id;

    const res = await fetch(`${liveapi}/${_id}`);
    const data = await res.json();

    const item = data.data; // backend se ek hi object aana chahiye

    // 🔥 form fill
    document.getElementById("Categoryname").value = item.Categoryname;
    document.getElementById("slug").value = item.Slug;
    document.getElementById("Description").value = item.Description;

    // 🔥 image preview
    if (item.Img) {
      preview.src = item.Img;
      preview.style.display = "block";
    }

    // 🔥 button change
    document.getElementById("saveBtn").innerText = "Update";

    openModal();
  } catch (error) {
    console.log("Edit error:", error);
  }
}
// Image preview
input.addEventListener("change", () => {
  const file = input.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});
