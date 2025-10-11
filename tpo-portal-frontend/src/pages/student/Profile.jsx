const Profile = () => {
  const student = {
    name: "Karan Sharma",
    branch: "CSE",
    rollNo: "CSE21045",
    cgpa: 8.7,
    resume: "resume.pdf",
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>
      <div className="space-y-2 text-gray-700">
        <p><strong>Name:</strong> {student.name}</p>
        <p><strong>Branch:</strong> {student.branch}</p>
        <p><strong>Roll No:</strong> {student.rollNo}</p>
        <p><strong>CGPA:</strong> {student.cgpa}</p>
        <a
          href={student.resume}
          className="text-blue-600 hover:underline"
          download
        >
          Download Resume
        </a>
      </div>
    </div>
  );
};

export default Profile;
