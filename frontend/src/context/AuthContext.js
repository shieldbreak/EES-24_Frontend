import { createContext, useState, useEffect} from "react";
import queryString from 'query-string'
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
const AuthContext = createContext()

export default AuthContext;

export const AuthProvider = ({children}) => {
    // console.log(JSON.parse(localStorage.getItem('authtokens')).access)
    const [authTokens, setAuthTokens] = useState(() => localStorage.getItem('authtokens') ? JSON.parse(localStorage.getItem('authtokens')) : null)
    const [user, setUser] = useState(() => localStorage.getItem('authtokens') ? jwtDecode(JSON.parse(localStorage.getItem('authtokens')).access) : null)
    const [loading, setLoading] = useState(true);
    const [userDetails, setUserDetails] = useState(null)
    const [pageloading, setPageLoading] = useState(false)

    const navigate = useNavigate()

    const googleAuthenticate = async (state, code) => {
        setPageLoading(true);
        if(state && code) {
            const details = {
                'code' : code,
                'state' : state,
            }
            const formBody = queryString.stringify(details)
            console.log(formBody);
            try {
                const res = await axios.post(`https://api.eesiitbhu.co.in/api/user/auth/social/o/google-oauth2/`, formBody, { type : 'application/x-www-form-urlencoded', withCredentials : true})
                const check1 = await axios.get(`https://api.eesiitbhu.co.in/api/user/`, {
                    headers : {
                        "Authorization" : `Bearer ${res.data.access}`
                    }
                })
                
                // console.log(check1.data);
                // console.log("check1");
                setAuthTokens(res.data);
                setUser(jwtDecode(res.data.access));
                // setUserDetails(check1.data)
                localStorage.setItem('authtokens', JSON.stringify(res.data));
                if(check1.data.profile.college === '' || check1.data.profile.year === '') {
                    navigate("/gsignup")
                    toast.info("Please fill college and year  !", {
                        position: "bottom-right"
                      });
                } else {
                    navigate('/dashboard');
                    toast.success("logged in succesfully !", {
                        position: "bottom-right"
                      });
                }
            } catch (err) {
                console.error(err);
            }
        }
        setPageLoading(false)
    }

    const signUpUser = async (validatedFormData) => {
        setPageLoading(true)
        const details = {
            "email" : validatedFormData.email,
            "name" : validatedFormData.name,
            "college" : validatedFormData.CollegeName,
            "year" : validatedFormData.year,
            "password" : validatedFormData.password,
            "password_confirmation" : validatedFormData.confirmPassword
        }
        const formBody = queryString.stringify(details);
        console.log(formBody);
        try {
            const res = await axios.post(`https://api.eesiitbhu.co.in/api/user/register/`, formBody, { type : 'application/json'})
            setAuthTokens(res.data);
            setUser(jwtDecode(res.data.access));
            localStorage.setItem('authtokens', JSON.stringify(res.data));
            const otpreq = await axios.get('https://api.eesiitbhu.co.in/api/user/verify/', {headers : {
            "Authorization" : `Bearer ${res.data.access}`
            }})
            console.log(otpreq);
            navigate('/otp');
            toast.info("verify the otp sent to registered mail id ", {
                position: "bottom-right"
              });
        } catch (err) {
            console.error(err);
            toast.error(" Something went wrong _auth1! ", {
                position: "bottom-right"
              });
        }
        setPageLoading(false);
    }

    const loginUser = async (validatedFormData) => {
        setPageLoading(true)
        const details = {
            "email" : validatedFormData.email,
            "password" : validatedFormData.password
        }
        const formBody = queryString.stringify(details) 
        console.log(formBody);
        try {
            const res = await axios.post('https://api.eesiitbhu.co.in/api/user/login/', formBody, {
                type: 'application/json'
            })
            setAuthTokens(res.data)
            setUser(jwtDecode(res.data.access))
            console.log(res.data)
            localStorage.setItem('authtokens', JSON.stringify(res.data))
            navigate('/dashboard')
            toast.success("Logged in succesfully !", {
                position: "bottom-right"
              });
        } catch(err) {
            console.error(err);
        }
        setPageLoading(false)
    }


    const logoutUser = async () => {
        setPageLoading(true)
        const details = {
            "refresh_token" : authTokens.refresh
        }
        const formBody = queryString.stringify(details)
        try {
            const res = await axios.post('https://api.eesiitbhu.co.in/api/user/logout/', formBody, {headers: {"Authorization" : `Bearer ${authTokens.access}`}})
            console.log(res)
        } catch(err) {
            console.log(err)
            toast.error("Something went wrong _auth1!", {
                position: "bottom-right"
              });
        }
        setPageLoading(false)
        setAuthTokens(null)
        setUser(null)
        localStorage.removeItem('authtokens')
        navigate('/');
        toast.success("loged out succesfully !", {
            position: "bottom-right"
          });
    }

    const updateUserInfo = async (validatedFormData) => {
        setPageLoading(true)
        if(authTokens) {
            const details = {
                'college' : validatedFormData.collegeName,
                'name' : validatedFormData.name,
                'year' : validatedFormData.year
            }
            const formData = queryString.stringify(details)
            try {
                const res = await axios.patch('https://api.eesiitbhu.co.in/api/user/update/', formData, {headers : {
                    "Authorization" : `Bearer ${authTokens.access}`
                }})
                console.log(res);
                if(res.status === 200) {
                    loadUser()
                    navigate("/dashboard")
                    // toast.success("")
                    toast.success("credentials updated succesfully !", {
                        position: "bottom-right"
                      });
                }
            } catch (err) {
                console.error(err);
                toast.error("something went wrong _auth2!", {
                    position: "bottom-right"
                  });
            }
        }
        setPageLoading(false)
    }

    const updateToken = async () => {
        console.log("Update token called");
        console.log(user)
        if(authTokens) {
            const token = {
                "refresh" : authTokens.refresh,
            }
            const formBody = queryString.stringify(token);
            console.log(formBody);
            try {
                const res = await axios.post('https://api.eesiitbhu.co.in/api/user/auth/jwt/refresh/', formBody, {
                    type : 'application/json'
                });
                console.log(res);
                const newTokens = {
                    'access' : res.data.access,
                    'refresh' : res.data.refresh,
                }
                setAuthTokens(newTokens)
                setUser(jwtDecode(res.data.access))
                localStorage.setItem("authtokens", JSON.stringify(newTokens))
            } catch (err) {
                console.error(err);
                toast.error("Something went wrong _auth3!", {
                    position: "bottom-right"
                  });
            }
            if(loading) {
                setLoading(false);
            }
        }
    }

    const loadUser = async () => {
        setPageLoading(true)
        try {
            const res = await axios.get('https://api.eesiitbhu.co.in/api/user/', { headers : {
            "Authorization" : `Bearer ${authTokens.access}`
            }})
            console.log(res.data);
            if(res.status >= 400) {
                updateToken();
            }
            setUserDetails(res.data)
        } catch (err) {
            console.error(err);
        }
        setPageLoading(false)
    }

    const contextData = {
        googleAuthenticate: googleAuthenticate,
        user: user,
        logoutUser: logoutUser,
        authTokens: authTokens,
        signUpUser: signUpUser,
        loginUser: loginUser,
        userDetails : userDetails,
        updateUserInfo : updateUserInfo,
        pageloading : pageloading,
        setPageLoading : setPageLoading,
        loadUser : loadUser,
    }

    useEffect(() => {
        if(loading) {
            updateToken()
        }
        const tfMinutes = 1000*60*25
        const interval = setInterval(()=> {
            if(authTokens) {
                updateToken()
            }
        }, tfMinutes)
        return () => clearInterval(interval)
    }, [authTokens, loading])

    useEffect(() => {
        let mounted = true;
        if(mounted && user && authTokens) {
          loadUser()
        }
        return () => {
          mounted = false;
        }
      }, [user, authTokens])

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    )
}
