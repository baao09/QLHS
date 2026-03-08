const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

app.use(express.json());
app.use(express.static("public"));

const dataPath = path.join(__dirname, "data", "students.json");

function readData() {
  try {
    const data = fs.readFileSync(dataPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// GET ALL
app.get("/students", (req, res) => {
  const students = readData();
  res.json(students);
});

// GET 1 student
app.get("/students/:ma", (req, res) => {
  const students = readData();
  const student = students.find(
    s => s.ma_hoc_sinh === req.params.ma
  );

  if (!student)
    return res.status(404).json({ message: "Không tìm thấy" });

  res.json(student);
});

// ADD
app.post("/students", (req, res) => {
  const students = readData();

  const {
    ma_hoc_sinh,
    ho_ten,
    ngay_sinh,
    gioi_tinh,
    lop,
    email,
    so_dien_thoai,
    nien_khoa,
    ghi_chu
  } = req.body;

  // 1️ Không được để trống (trừ ghi_chu)
  if (
    !ma_hoc_sinh || !ho_ten || !ngay_sinh ||
    !gioi_tinh || !lop || !email ||
    !so_dien_thoai || !nien_khoa
  ) {
    return res.status(400).json({ message: "Không được để trống thông tin!" });
  }

  // 2️ Không trùng mã
  if (students.find(s => s.ma_hoc_sinh === ma_hoc_sinh)) {
    return res.status(400).json({ message: "Mã học sinh đã tồn tại!" });
  }

  // 3️ SĐT 10 số
  if (!/^[0-9]{10}$/.test(so_dien_thoai)) {
    return res.status(400).json({ message: "SĐT phải đủ 10 số!" });
  }

  // 4️ Gmail
  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
    return res.status(400).json({ message: "Email phải là Gmail hợp lệ!" });
  }

  // 5️ Niên khóa
  if (!/^\d{4}-\d{4}$/.test(nien_khoa)) {
    return res.status(400).json({ message: "Niên khóa phải dạng 2023-2026!" });
  }

  // 6️ Giới tính
  if (!["Nam", "Nữ"].includes(gioi_tinh)) {
    return res.status(400).json({ message: "Giới tính không hợp lệ!" });
  }

  students.push(req.body);
  writeData(students);

  res.json({ message: "Thêm thành công!" });
});

// UPDATE
app.put("/students/:ma", (req, res) => {
  const students = readData();
  const index = students.findIndex(
    s => s.ma_hoc_sinh === req.params.ma
  );

  if (index === -1)
    return res.status(404).json({ message: "Không tìm thấy" });

  const {
    ho_ten,
    ngay_sinh,
    gioi_tinh,
    lop,
    email,
    so_dien_thoai,
    nien_khoa
  } = req.body;

  if (
    !ho_ten || !ngay_sinh || !gioi_tinh ||
    !lop || !email || !so_dien_thoai || !nien_khoa
  ) {
    return res.status(400).json({ message: "Không được để trống!" });
  }

  if (!/^[0-9]{10}$/.test(so_dien_thoai))
    return res.status(400).json({ message: "SĐT không hợp lệ!" });

  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email))
    return res.status(400).json({ message: "Email không hợp lệ!" });

  if (!/^\d{4}-\d{4}$/.test(nien_khoa))
    return res.status(400).json({ message: "Niên khóa sai định dạng!" });

  students[index] = { ...students[index], ...req.body };

  writeData(students);

  res.json({ message: "Cập nhật thành công!" });
});

// DELETE
app.delete("/students/:ma", (req, res) => {
  let students = readData();
  students = students.filter(
    s => s.ma_hoc_sinh !== req.params.ma
  );
  writeData(students);
  res.json({ message: "Xóa thành công" });
});

// SEARCH
app.get("/search", (req, res) => {
  const keyword = req.query.q.toLowerCase();
  const students = readData();

  const result = students.filter(s =>
    s.ma_hoc_sinh.toLowerCase().includes(keyword) ||
    s.ho_ten.toLowerCase().includes(keyword) ||
    s.lop.toLowerCase().includes(keyword) ||
    s.email.toLowerCase().includes(keyword)
  );

  res.json(result);
});

app.listen(PORT, () => {
  console.log("Server chạy tại http://localhost:" + PORT);
});
