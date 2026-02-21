export const redirectByRole = (user, navigate) => {
  if (!user?.role) return navigate("/login");

  switch (user.role) {
    case "admin":
      navigate("/admin/dashboard");
      break;

    case "instructor":
      navigate("/instructor/dashboard");
      break;

    case "student":
      navigate("/student/dashboard");
      break;

    default:
      navigate("/login");
  }
};
