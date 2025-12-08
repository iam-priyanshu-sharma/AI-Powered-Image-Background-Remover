import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const navigate = useNavigate();
  const [image, setImage] = useState(false);
  const [resultImage, setResultImage] = useState(false);
  const { getToken } = useAuth();
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [credit, setCredit] = useState(false);

  // ✅ loadCreditsData no longer calls useUser hook
  const loadCreditsData = async () => {
    try {
      if (!user) return;

      const token = await getToken();
      if (!token) return;

      const { data } = await axios.get(`${backendUrl}/api/user/credits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setCredit(data.credits);
      } else {
        setCredit(0);
      }
    } catch (error) {
      console.error("Credit load error:", error.message);
      toast.error("Unable to load credits");
      setCredit(0);
    }
  };

  const removeBG = async (image) => {
    try {
      if (!isSignedIn) {
        return openSignIn();
      }

      setResultImage(false);
      setImage(image);

      navigate("/result");

      const token = await getToken();

      const formData = new FormData();
      image && formData.append("image", image);

      const { data } = await axios.post(
        backendUrl + "/api/image/remove-bg",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setResultImage(data.resultImage);
        data.creditBalance && setCredit(data.creditBalance);
      } else {
        toast.error(data.message);
        data.creditBalance && setCredit(data.creditBalance);
        if (data.creditBalance === 0) {
          navigate("/buy");
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const value = {
    image,
    setImage,
    backendUrl,
    removeBG,
    loadCreditsData,
    resultImage,
    setResultImage,
    credit,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
