const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

/* ===============================
   KẾT NỐI DATABASE (POOL)
================================ */

// Trên Railway, dùng MYSQL_URL là ổn định nhất, nếu không có sẽ dùng các biến rời
const db = mysql.createPool(process.env.MYSQL_URL || {
  host: process.env.MYSQLHOST || "mysql.railway.internal",
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "KIOiGukHYmqyOPcUezFMZbikOBTBOZji",
  database: process.env.MYSQLDATABASE || "railway",
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Lỗi kết nối MySQL:", err.message);
    // In ra thông tin host đang cố kết nối để dễ debug trên Railway
    console.error(`Đang cố kết nối tới Host: ${process.env.MYSQLHOST || 'localhost'}`);
  } else {
    console.log("✅ Đã kết nối MySQL thành công!");
    connection.release();
  }
});

/* ===============================
   TẠO BẢNG NẾU CHƯA CÓ
================================ */

db.query(`
CREATE TABLE IF NOT EXISTS students (
  ma_hoc_sinh VARCHAR(10) PRIMARY KEY,
  ho_ten VARCHAR(100),
  ngay_sinh DATE,
  gioi_tinh VARCHAR(10),
  lop VARCHAR(20),
  email VARCHAR(100),
  so_dien_thoai VARCHAR(20),
  nien_khoa VARCHAR(20),
  ghi_chu TEXT
)
`, (err) => {
  if (err) {
    console.error("Lỗi tạo bảng:", err);
  } else {
    console.log("Bảng students đã sẵn sàng");
  }
});

/* ===============================
   GET ALL STUDENTS
================================ */

app.get("/students", (req, res) => {
  db.query("SELECT * FROM students", (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi server khi lấy danh sách học sinh!" });
    }

    res.json(result);
  });
});

/* ===============================
   GET 1 STUDENT
================================ */

app.get("/students/:ma", (req, res) => {

  db.query(
    "SELECT * FROM students WHERE ma_hoc_sinh = ?",
    [req.params.ma],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Lỗi server!" });
      }

      if (result.length === 0)
        return res.status(404).json({ message: "Không tìm thấy học sinh!" });

      res.json(result[0]);
    }
  );
});

/* ===============================
   ADD STUDENT
================================ */

app.post("/students", (req, res) => {

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

  if (
    !ma_hoc_sinh || !ho_ten || !ngay_sinh ||
    !gioi_tinh || !lop || !email ||
    !so_dien_thoai || !nien_khoa
  ) {
    return res.status(400).json({ message: "Không được để trống thông tin!" });
  }

  if (!/^[0-9]{10}$/.test(so_dien_thoai))
    return res.status(400).json({ message: "SĐT phải đủ 10 số!" });

  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email))
    return res.status(400).json({ message: "Email phải là Gmail hợp lệ!" });

  if (!/^\d{4}-\d{4}$/.test(nien_khoa))
    return res.status(400).json({ message: "Niên khóa phải dạng 2023-2026!" });

  if (!["Nam", "Nữ"].includes(gioi_tinh))
    return res.status(400).json({ message: "Giới tính không hợp lệ!" });

  const sql = `
  INSERT INTO students
  (ma_hoc_sinh, ho_ten, ngay_sinh, gioi_tinh, lop, email, so_dien_thoai, nien_khoa, ghi_chu)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      ma_hoc_sinh,
      ho_ten,
      ngay_sinh,
      gioi_tinh,
      lop,
      email,
      so_dien_thoai,
      nien_khoa,
      ghi_chu
    ],
    (err) => {

      if (err) {

        console.error(err);

        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ message: "Mã học sinh đã tồn tại!" });

        return res.status(500).json({ message: "Lỗi server khi thêm học sinh!" });
      }

      res.json({ message: "Thêm thành công!" });
    }
  );
});

/* ===============================
   UPDATE STUDENT
================================ */

app.put("/students/:ma", (req, res) => {

  const {
    ho_ten,
    ngay_sinh,
    gioi_tinh,
    lop,
    email,
    so_dien_thoai,
    nien_khoa,
    ghi_chu
  } = req.body;

  if (
    !ho_ten || !ngay_sinh || !gioi_tinh ||
    !lop || !email || !so_dien_thoai || !nien_khoa
  ) {
    return res.status(400).json({ message: "Không được để trống!" });
  }

  const sql = `
  UPDATE students SET
  ho_ten = ?,
  ngay_sinh = ?,
  gioi_tinh = ?,
  lop = ?,
  email = ?,
  so_dien_thoai = ?,
  nien_khoa = ?,
  ghi_chu = ?
  WHERE ma_hoc_sinh = ?
  `;

  db.query(
    sql,
    [
      ho_ten,
      ngay_sinh,
      gioi_tinh,
      lop,
      email,
      so_dien_thoai,
      nien_khoa,
      ghi_chu,
      req.params.ma
    ],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Lỗi server khi cập nhật!" });
      }

      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Không tìm thấy học sinh!" });

      res.json({ message: "Cập nhật thành công!" });
    }
  );
});

/* ===============================
   DELETE STUDENT
================================ */

app.delete("/students/:ma", (req, res) => {

  db.query(
    "DELETE FROM students WHERE ma_hoc_sinh = ?",
    [req.params.ma],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Lỗi server khi xóa!" });
      }

      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Không tìm thấy học sinh!" });

      res.json({ message: "Xóa thành công!" });
    }
  );
});

/* ===============================
   SEARCH
================================ */

app.get("/search", (req, res) => {

  const keyword = "%" + req.query.q + "%";

  const sql = `
  SELECT * FROM students
  WHERE ma_hoc_sinh LIKE ?
  OR ho_ten LIKE ?
  OR lop LIKE ?
  OR email LIKE ?
  `;

  db.query(
    sql,
    [keyword, keyword, keyword, keyword],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Lỗi server khi tìm kiếm!" });
      }

      res.json(result);
    }
  );
});
/* ===============================
   GET ALL STUDENTS (Hỗ trợ Sắp xếp)
================================ */
app.get("/students", (req, res) => {
  let sql = "SELECT * FROM students";
  
  const { sort, order } = req.query;

  if (sort) {
    // Lọc kỹ các cột hợp lệ để chống SQL Injection
    const allowedSorts = ["ma_hoc_sinh", "ho_ten", "ngay_sinh", "gioi_tinh", "lop"];
    const sortFields = sort.split(',').filter(f => allowedSorts.includes(f));

    if (sortFields.length > 0) {
      // Đảm bảo Order chỉ có thể là ASC hoặc DESC
      const orderDir = order === 'DESC' ? 'DESC' : 'ASC';
      
      // SQL sẽ tự ưu tiên theo thứ tự trường được join. VD: ORDER BY ma_hoc_sinh ASC, ho_ten ASC
      sql += ` ORDER BY ${sortFields.join(', ')} ${orderDir}`;
    }
  }

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi server khi lấy danh sách học sinh!" });
    }
    res.json(result);
  });
});
/* ===============================
   START SERVER
================================ */

app.listen(PORT, () => {
  console.log("Server chạy tại port " + PORT);
});