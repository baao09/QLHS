const list = document.getElementById("list")

let students = []
let currentPage = 1
const perPage = 10

async function loadStudents() {
  const res = await fetch("/students")
  students = await res.json()
  currentPage = 1
  render()
}

function render() {
  if (!list) return

  list.innerHTML = ""

  const start = (currentPage - 1) * perPage
  const end = start + perPage
  const pageData = students.slice(start, end)

  pageData.forEach(s => {
    list.innerHTML += `
      <tr class="border-t text-center text-sm">
        <td>${s.ma_hoc_sinh}</td>
        <td>${s.ho_ten}</td>
        <td>${s.ngay_sinh}</td>
        <td>${s.gioi_tinh}</td>
        <td>${s.lop}</td>
        <td>${s.email}</td>
        <td>${s.so_dien_thoai}</td>
        <td>${s.nien_khoa}</td>
        <td>${s.ghi_chu || ""}</td>
        <td>
          <a href="/edit.html?ma=${s.ma_hoc_sinh}"
            class="text-blue-500 hover:underline mr-2">
            Sửa
          </a>
          <button onclick="deleteStudent('${s.ma_hoc_sinh}')"
            class="text-red-500 hover:underline">
            Xóa
          </button>
        </td>
      </tr>
    `
  })

  const pageInfo = document.getElementById("pageInfo")
  if (pageInfo) {
    pageInfo.innerText =
      `Trang ${currentPage} / ${Math.ceil(students.length / perPage)}`
  }
}

const prevBtn = document.getElementById("prevBtn")
if (prevBtn) {
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--
      render()
    }
  }
}

const nextBtn = document.getElementById("nextBtn")
if (nextBtn) {
  nextBtn.onclick = () => {
    if (currentPage < Math.ceil(students.length / perPage)) {
      currentPage++
      render()
    }
  }
}

async function addStudent() {
  const student = {
    ma_hoc_sinh: ma.value.trim(),
    ho_ten: ten.value.trim(),
    ngay_sinh: ns.value,
    gioi_tinh: gt.value,
    lop: lop.value.trim(),
    email: email.value.trim(),
    so_dien_thoai: sdt.value.trim(),
    nien_khoa: nk.value.trim(),
    ghi_chu: gc.value.trim()
  };

  const res = await fetch("/students", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(student)
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message);
    return;
  }

  alert("Thêm thành công!");
  window.location.href = "/";
}

async function deleteStudent(ma) {
  if (!confirm("Bạn có chắc muốn xóa?")) return
  await fetch(`/students/${ma}`, { method: "DELETE" })
  loadStudents()
}

async function searchStudent() {
  const input = document.getElementById("keyword")
  if (!input) return

  const keyword = input.value
  const res = await fetch(`/search?q=${keyword}`)
  students = await res.json()
  currentPage = 1
  render()
}

if (window.location.pathname === "/") {
  loadStudents()
}