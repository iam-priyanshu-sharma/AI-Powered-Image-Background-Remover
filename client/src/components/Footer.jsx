import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 py-6 mt-16 animate-fade-in">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-gray-600 text-sm">
          Created by{" "}
          <a
            href="https://iam-priyanshu-sharma.github.io/Portfolio/?#"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition-all duration-200"
          >
            Priyanshu Sharma
          </a>{" "}
          | © {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
