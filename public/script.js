const list = document.getElementById("list")

let students = []
let currentPage = 1
const perPage = 10

// --- LOGIC SẮP XẾP ---
let currentSortParams = "";

// Nạp file sort.html vào index.html
async function loadSortComponent() {
  const sortContainer = document.getElementById('sortComponent');
  if (sortContainer) {
    try {
      const res = await fetch('/sort.html');
      const html = await res.text();
      sortContainer.innerHTML += html;
    } catch (e) {
      console.error("Lỗi khi load component sắp xếp", e);
    }
  }
}

// Mở/Đóng menu sắp xếp
function toggleSort(event) {
  event.stopPropagation(); // Ngăn click lan ra ngoài
  const menu = document.getElementById('sortDropdown');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

// Tự động đóng menu khi click ra ngoài vùng lựa chọn
document.addEventListener('click', (event) => {
  const menu = document.getElementById('sortDropdown');
  // Nếu menu đang mở và click bên ngoài menu + bên ngoài nút
  if (menu && !menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
  }
});

// Hàm áp dụng sắp xếp khi bấm nút "Lưu"
function applySort() {
  // Lấy danh sách các điều kiện được tick (thứ tự trên HTML đã chuẩn từ trên xuống)
  const conditions = Array.from(document.querySelectorAll('.sort-condition:checked')).map(cb => cb.value);
  const order = document.querySelector('input[name="sortOrder"]:checked').value;

  if (conditions.length > 0) {
    // Ghép các trường thành chuỗi, VD: "?sort=ma_hoc_sinh,ho_ten&order=ASC"
    currentSortParams = `?sort=${conditions.join(',')}&order=${order}`;
  } else {
    currentSortParams = ""; // Reset nếu bỏ tick hết
  }

  // Đóng menu và load lại data
  const menu = document.getElementById('sortDropdown');
  if (menu) menu.classList.add('hidden');
  loadStudents();
}
async function loadStudents() {
  // Thêm currentSortParams vào URL để gửi lên server
  const res = await fetch(`/students${currentSortParams}`);
  students = await res.json();
  currentPage = 1;
  render();
}

function render() {
  if (!list) return

  list.innerHTML = ""

  const start = (currentPage - 1) * perPage
  const end = start + perPage
  const pageData = students.slice(start, end)

  pageData.forEach(s => {
    // Chuyển đổi ngày sinh sang định dạng yyyy-mm-dd
    const formatDate = s.ngay_sinh ? s.ngay_sinh.split('T')[0] : "";

    list.innerHTML += `
      <tr class="border-t text-center text-sm">
        <td>${s.ma_hoc_sinh}</td>
        <td>${s.ho_ten}</td>
        <td>${formatDate}</td> <td>${s.gioi_tinh}</td>
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
  loadSortComponent().then(() => {
    // Chỉ load danh sách học sinh sau khi đã chuẩn bị xong DOM
    loadStudents();
  });
}