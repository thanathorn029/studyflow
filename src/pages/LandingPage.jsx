import React, { useEffect } from "react";
import "../LandingPage.css";
import logo from "../img/Logo/logo.png";

export default function LandingPage() {

  useEffect(() => {

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    document
      .querySelectorAll(".reveal")
      .forEach(el => observer.observe(el));

  }, []);

  const toggleFaq = (el) => {
    el.classList.toggle("open");
  };

  const handleBuy = () => {
    alert("🚀 กำลังเปิดหน้าชำระเงิน...");
  };

  return (

    <div>

      <nav>

<a href="#" className="nav-brand">
  <img
    src={logo}
    alt="logo"
    className="nav-logo-img"
  />
</a>

        <div className="nav-links">
          <a href="#features">ฟีเจอร์</a>
          <a href="#pricing">ราคา</a>
          <a href="#faq">FAQ</a>

          <a href="/login" className="nav-cta">
            เริ่มใช้งานฟรี →
          </a>
        </div>

      </nav>

      {/* HERO */}
      <section className="hero">

        <div className="hero-badge">
          <div className="badge-dot"></div>
          เปิดให้ใช้งานแล้ว — เวอร์ชัน Beta
        </div>

        <h1 className="hero-title">
          เรียนให้ได้ <br />
          <span>GPA ที่ใฝ่ฝัน</span>
        </h1>

        <p className="hero-sub">
          แอปจัดการการเรียนครบวงจร
          ตารางเรียน จับเวลา ติดตาม GPA
        </p>

        <div className="hero-btns">

          <a href="#pricing" className="btn-primary">
            🚀 ทดลองใช้ฟรี 30 วัน
          </a>

          <a href="#features" className="btn-secondary">
            ดูฟีเจอร์ทั้งหมด
          </a>

        </div>

      </section>

      {/* FEATURES */}
      <section className="section" id="features">

        <div className="reveal">

          <div className="section-label">
            ฟีเจอร์หลัก
          </div>

          <h2 className="section-title">
            ทุกอย่างที่นักศึกษา<br />
            ต้องการ
          </h2>

          <p className="section-sub">
            ออกแบบมาเพื่อนักศึกษาไทย
            ใช้งานง่าย ไม่ซับซ้อน
          </p>

        </div>

        <div className="features-grid reveal">

          <div className="feature-card">
            <div className="feature-icon fi-yellow">📅</div>
            <div className="feature-title">ตารางเรียน</div>
            <div className="feature-desc">
              ใส่ตารางเรียนทั้งภาคเรียน
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon fi-red">📊</div>
            <div className="feature-title">สถิติการเรียน</div>
            <div className="feature-desc">
              วิเคราะห์นิสัยการเรียน
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon fi-teal">🔥</div>
            <div className="feature-title">Streak</div>
            <div className="feature-desc">
              สร้างนิสัยเรียนต่อเนื่อง
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon fi-yellow">⏱</div>
            <div className="feature-title">Pomodoro</div>
            <div className="feature-desc">
              จับเวลาเรียน
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon fi-red">📋</div>
            <div className="feature-title">Deadline</div>
            <div className="feature-desc">
              ไม่ลืมส่งงาน
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon fi-teal">🎯</div>
            <div className="feature-title">GPA</div>
            <div className="feature-desc">
              ตั้งเป้า GPA
            </div>
          </div>

        </div>

      </section>

      {/* PRICING */}
      <section className="section" id="pricing">

        <div className="reveal" style={{ textAlign: "center" }}>

          <div className="section-label">
            ราคา
          </div>

          <h2 className="section-title">
            เริ่มต้นฟรี
          </h2>

        </div>

        <div className="pricing-grid reveal">

          <div className="pricing-card">

            <div className="pricing-plan">
              Free
            </div>

            <div className="pricing-price">
              0<span> ฿</span>
            </div>

            <button className="btn-pricing btn-pricing-free">
              เริ่มใช้ฟรี
            </button>

          </div>

          <div className="pricing-card featured">

            <div className="pricing-plan">
              Pro
            </div>

            <div className="pricing-price">
              49<span> ฿</span>
            </div>

            <button
              className="btn-pricing btn-pricing-pro"
              onClick={handleBuy}
            >
              🚀 อัปเกรด
            </button>

          </div>

        </div>

      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">

        <div className="how-inner">

          <div
            className="reveal"
            style={{ textAlign: "center" }}
          >

            <div className="section-label">
              วิธีใช้งาน
            </div>

            <h2 className="section-title">
              เริ่มต้นง่ายใน
              <br />
              4 ขั้นตอน
            </h2>

          </div>

          <div className="steps-row reveal">

            <div className="step">
              <div className="step-num">01</div>
              <div className="step-title">สมัครฟรี</div>
              <div className="step-desc">สมัครด้วยอีเมล</div>
            </div>

            <div className="step">
              <div className="step-num">02</div>
              <div className="step-title">ใส่ตารางเรียน</div>
              <div className="step-desc">เพิ่มวิชา</div>
            </div>

            <div className="step">
              <div className="step-num">03</div>
              <div className="step-title">ตั้งเป้า GPA</div>
              <div className="step-desc">กำหนดเป้าหมาย</div>
            </div>

            <div className="step">
              <div className="step-num">04</div>
              <div className="step-title">เริ่มเรียน</div>
              <div className="step-desc">ใช้ Pomodoro</div>
            </div>

          </div>

        </div>

      </section>

      {/* FAQ */}
      <section className="section" id="faq">

        <div className="faq-list reveal">

          <div
            className="faq-item"
            onClick={(e) => toggleFaq(e.currentTarget)}
          >

            <div className="faq-q">
              ใช้งานฟรีไหม ?
              <span className="faq-icon">+</span>
            </div>

            <div className="faq-a">
              ใช้งานฟรีได้ตลอด
            </div>

          </div>

          <div
            className="faq-item"
            onClick={(e) => toggleFaq(e.currentTarget)}
          >

            <div className="faq-q">
              ใช้ในมือถือได้ไหม ?
              <span className="faq-icon">+</span>
            </div>

            <div className="faq-a">
              ใช้ได้ทุกอุปกรณ์
            </div>

          </div>

        </div>

      </section>

      <footer>

        <div className="footer-copy">
          © 2026 StudyFlow — Made for Students
        </div>

        <div className="footer-links">

          <a href="#">
            นโยบายความเป็นส่วนตัว
          </a>

          <a href="#">
            ติดต่อเรา
          </a>

          <a href="#">
            Line OA
          </a>

        </div>

      </footer>

    </div>

  );

}