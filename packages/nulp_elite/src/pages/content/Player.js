import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import Footer from "components/Footer";
import Header from "components/header";
import Container from "@mui/material/Container";
import FloatingChatIcon from "../../components/FloatingChatIcon";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { SunbirdPlayer } from "@shiksha/common-lib";
import * as util from "../../services/utilService";
import axios from "axios";
import Link from "@mui/material/Link";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import FeedbackPopup from "components/FeedbackPopup";
import {
  FacebookShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  FacebookIcon,
  WhatsappIcon,
  LinkedinIcon,
} from "react-share";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import md5 from "md5";
import { isEmpty, set } from "lodash";
const urlConfig = require("../../configs/urlConfig.json");
const routeConfig = require("../../configs/routeConfig.json");
const Player = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [trackData, setTrackData] = useState();
  const [previousRoute, setPreviousRoute] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [courseName, setCourseName] = useState(location.state?.coursename);
  const [batchId, setBatchId] = useState(location.state?.batchid);
  const [courseId, setCourseId] = useState(location.state?.courseid);
  const shareUrl = window.location.href; // Current page URL
  const [isEnrolled, setIsEnrolled] = useState(
    location.state?.isenroll || undefined
  );
  const [consumedContent, setConsumedContents] = useState(
    location.state?.consumedcontents || []
  );
  const [lesson, setLesson] = useState();
  const [isCompleted, setIsCompleted] = useState(false);
  const [openFeedBack, setOpenFeedBack] = useState(false);
  const [assessEvents, setAssessEvents] = useState([]);
  const [propLength, setPropLength] = useState();
  const _userId = util.userId();
  const [isLearnathon, setIsLearnathon] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [pollId, setPollId] = useState();
  const [learnathonDetails, setLearnathonDetails] = useState();
  const [isPublished, setIsPublished] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get("page");
  let contentId = params.get("id");
  const [playerContent, setPlayerContent] = useState();
  const [noPreviewAvailable, setNoPreviewAvailable] = useState(false);
  // const playerUrl = `${window.location.origin}/newplayer`;
  const playerUrl =
    window.location.origin != "http://localhost:3000"
      ? `${window.location.origin}/newplayer`
      : "https://devnulp.niua.org/newplayer";

  let extractedRoles;
  if (contentId && contentId.endsWith("=")) {
    contentId = contentId.slice(0, -1);
  }
  const [reviewEnable, setReviewEnable] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const userData = await util.userData();
      extractedRoles = userData?.data?.result?.response.roles.map(
        (roleObj) => roleObj.role
      );
      setUserFirstName(userData?.data?.result?.response?.firstName);
      setUserLastName(userData?.data?.result?.response?.lastName);
      checkIsReview();
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  const handleTrackData = useCallback(
    async ({ score, trackData, attempts, ...props }, playerType = "quml") => {
      console.log("assestrack", Object.keys(props).length);
      setPropLength(Object.keys(props).length);
      CheckfeedBackSubmitted();

      if (
        playerType === "pdf-video" &&
        props.currentPage === props.totalPages
      ) {
        setIsCompleted(true);
      } else if (playerType === "ecml" && propLength === assessEvents.length) {
        await updateContentStateForAssessment();
      }
    },
    [assessEvents]
  ); 
  const handleAssessmentData = async (data) => {
    console.log("data  handleAssessmentData----", data);
    if (data.eid === "ASSESS") {
      setAssessEvents((prevAssessEvents) => {
        const updatedAssessEvents = [...prevAssessEvents, data];
        return updatedAssessEvents;
      });
    } else if (data.eid === "END") {
      console.log("data  assessEvents----", assessEvents);

      await updateContentState(2);
    } else if (data.eid === "START" && playerType === "ecml") {
      await updateContentState(1);
    } else if (data.eid === "START" && playerType != "ecml") {
      await updateContentState(2);
    }
  };

  useEffect(() => {
    if (propLength === assessEvents.length) {
      updateContentStateForAssessment();
    }
    handleTrackData();
  }, [assessEvents, propLength]);

  const CheckfeedBackSubmitted = async () => {
    try {
      const url = `${urlConfig.URLS.FEEDBACK.LIST}`;
      const RequestBody = {
        request: {
          filters: {
            content_id: contentId,
            user_id: _userId,
          },
        },
      };
      const response = await axios.post(url, RequestBody);
      console.log(response.data);
      if (response.data?.result?.totalCount === 0) {
        setOpenFeedBack(true);
      } else {
        setOpenFeedBack(false);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
    }
  };

  function formatDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

    const offset = -now.getTimezoneOffset();
    const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(
      2,
      "0"
    );
    const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, "0");
    const offsetSign = offset >= 0 ? "+" : "-";

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}:${milliseconds}${offsetSign}${offsetHours}${offsetMinutes}`;
  }

  function getCurrentTimestamp() {
    return Date.now();
  }

  const attemptid = () => {
    const timestamp = new Date().getTime();
    const string = [courseId, batchId, contentId, _userId, timestamp].join("-");
    const hashValue = md5(string);
    return hashValue;
  };

  function checkIsReview() {
    if (
      pageParam == "review" &&
      extractedRoles.includes("SYSTEM_ADMINISTRATION")
    ) {
      setReviewEnable(true);
    } else if (
      pageParam == "lern" &&
      extractedRoles.includes("SYSTEM_ADMINISTRATION")
    ) {
      setReviewEnable(true);
    }
  }

  const updateContentStateForAssessment = async () => {
    // await updateContentState(2);
    try {
      const url = `${urlConfig.URLS.CONTENT_PREFIX}${urlConfig.URLS.COURSE.USER_CONTENT_STATE_UPDATE}`;
      const requestBody = {
        request: {
          userId: _userId,
          contents: [
            {
              contentId: contentId,
              batchId: batchId,
              status: 2,
              courseId: courseId,
              lastAccessTime: formatDate(),
            },
          ],
          assessments: [
            {
              assessmentTs: getCurrentTimestamp(),
              batchId: batchId,
              courseId: courseId,
              userId: _userId,
              attemptId: attemptid(),
              contentId: contentId,
              events: assessEvents,
            },
          ],
        },
      };
      const response = await axios.patch(url, requestBody);
      console.log("assesment state updated");
    } catch (error) {
      console.error("Error fetching course data:", error);
    }
  };

  const updateContentState = useCallback(
    async (status) => {
      // if (isEnrolled) {
      const url = `${urlConfig.URLS.CONTENT_PREFIX}${urlConfig.URLS.COURSE.USER_CONTENT_STATE_UPDATE}`;
      await axios.patch(url, {
        request: {
          userId: _userId,
          contents: [{ contentId, courseId, batchId, status }],
        },
      });
      // }
    },
    [isEnrolled, _userId, contentId, courseId, batchId]
  );

  const replaceDomain = (obj, oldDomain, newDomain) => {
    if (typeof obj === "string") {
      return obj.replace(new RegExp(oldDomain, "g"), newDomain);
    } else if (Array.isArray(obj)) {
      return obj.map((item) => replaceDomain(item, oldDomain, newDomain));
    } else if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        acc[key] = replaceDomain(value, oldDomain, newDomain);
        return acc;
      }, {});
    }

    return obj;
  };

  useEffect(
    async () => {
      setPreviousRoute(sessionStorage.getItem("previousRoutes"));
      if (pageParam != "vote") {
        const fetchData = async (content_Id) => {
          try {
            const response = await fetch(
              `${urlConfig.URLS.PUBLIC_PREFIX}${urlConfig.URLS.CONTENT.GET}/${content_Id}?fields=transcripts,ageGroup,appIcon,artifactUrl,attributions,attributions,audience,author,badgeAssertions,board,body,channel,code,concepts,contentCredits,contentType,contributors,copyright,copyrightYear,createdBy,createdOn,creator,creators,description,displayScore,domain,editorState,flagReasons,flaggedBy,flags,framework,gradeLevel,identifier,itemSetPreviewUrl,keywords,language,languageCode,lastUpdatedOn,license,mediaType,medium,mimeType,name,originData,osId,owner,pkgVersion,publisher,questions,resourceType,scoreDisplayConfig,status,streamingUrl,subject,template,templateId,totalQuestions,totalScore,versionKey,visibility,year,primaryCategory,additionalCategories,interceptionPoints,interceptionType&orgdetails=orgName,email&licenseDetails=name,description,url`,
              {
                headers: { "Content-Type": "application/json" },
              }
            );
            if (!response.ok) throw new Error("Failed to fetch course data");
            const data = await response.json();
            console.log("data.result.content", data.result.content);
            const updatedResponse = replaceDomain(
              data.result.content,

              "nulpstorage1.blob.core.windows.net",
              "nulpstorage.blob.core.windows.net"
            );
            console.log("updatedResponse", updatedResponse);

            setLesson(updatedResponse);
          } catch (error) {
            console.error("Error fetching course data:", error);
          }
        };

        if (
          pageParam == "review" ||
          pageParam == "lern" ||
          pageParam == "lernpreview" ||
          pageParam == "dashboard"
        ) {
          setIsLearnathon(true);

          const assetBody = {
            request: {
              filters: {
                learnathon_content_id: contentId,
              },
            },
          };
          try {
            const response = await fetch(`${urlConfig.URLS.LEARNATHON.LIST}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(assetBody),
            });

            setLearnathonDetails(response?.data?.result?.data[0]);

            if (!response.ok) {
              throw new Error("Something went wrong");
            }

            const result = await response.json();
            console.log("suceesss----", result);
            console.log(result.result);

            setLearnathonDetails(result.result.data[0]);
            // setCourseId(result.result.data[0].content_id);
            setPlayerContent(result.result.data[0].content_id);
            if (result.result.data[0].status == "Live") {
              setIsPublished(true);
            }

            if (result.result.data[0].content_id === null || undefined) {
              setNoPreviewAvailable(true);
            } else {
              fetchData(result.result.data[0].content_id);
            }
          } catch (error) {
            console.log("error---", error);
          } finally {
          }
        } else {
          fetchData(contentId);
        }

        fetchUserData();
        if (!consumedContent.includes(contentId)) {
          updateContentState(2);
        }
      }
    },
    [contentId, consumedContent, fetchUserData, updateContentState],
    pageParam
  );

  useEffect(() => {
    if (isCompleted) {
      updateContentState(2);
    }
  }, [isCompleted, updateContentState]);

  const handleClose = () => setOpenFeedBack(false);
  const handleGoBack = () => navigate(sessionStorage.getItem("previousRoutes"));
  const handleBackNavigation = () => {
    console.log("pageParam - ", pageParam);
    if (pageParam == "vote") {
      navigate("/webapp/lernvotinglist");
      window.location.reload();
    } else if (pageParam == "lern") {
      navigate("/webapp/lernreviewlist", { state: { backPage: "player" } });
      window.location.reload();
    } else if (pageParam == "lernpreview") {
      navigate("/webapp/mylernsubmissions");
      window.location.reload();
    } else if (pageParam == "dashboard") {
      navigate("/webapp/learndashboard");
      window.location.reload();
    } else {
      console.log(
        "sessionStorage.getItem(previousRoutes) - ",
        sessionStorage.getItem("previousRoutes")
      );
      if (sessionStorage.getItem("previousRoutes")) {
        navigate(sessionStorage.getItem("previousRoutes"));
        window.location.reload();
      } else {
        navigate(-1); // Navigate back in history
      }
    }
  };

  const fetchData = async (content_Id) => {
    try {
      const response = await fetch(
        `${urlConfig.URLS.PUBLIC_PREFIX}${urlConfig.URLS.CONTENT.GET}/${content_Id}?fields=transcripts,ageGroup,appIcon,artifactUrl,attributions,attributions,audience,author,badgeAssertions,board,body,channel,code,concepts,contentCredits,contentType,contributors,copyright,copyrightYear,createdBy,createdOn,creator,creators,description,displayScore,domain,editorState,flagReasons,flaggedBy,flags,framework,gradeLevel,identifier,itemSetPreviewUrl,keywords,language,languageCode,lastUpdatedOn,license,mediaType,medium,mimeType,name,originData,osId,owner,pkgVersion,publisher,questions,resourceType,scoreDisplayConfig,status,streamingUrl,subject,template,templateId,totalQuestions,totalScore,versionKey,visibility,year,primaryCategory,additionalCategories,interceptionPoints,interceptionType&orgdetails=orgName,email&licenseDetails=name,description,url`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch course data");
      const data = await response.json();
      console.log("data.result.content", data.result.content);
      const updatedResponse = replaceDomain(
        data.result.content,

        "nulpstorage1.blob.core.windows.net",
        "nulpstorage.blob.core.windows.net"
      );
      console.log("updatedResponse", updatedResponse);

      setLesson(updatedResponse);
    } catch (error) {
      console.error("Error fetching course data:", error);
    }
  };

  const CheckLearnathonContent = async () => {
    const currentDateTime = new Date();
    currentDateTime.setMinutes(currentDateTime.getMinutes() + 2);
    const updatedDateTime = currentDateTime.toISOString();
    console.log(updatedDateTime, "currentDateAndTime");
    try {
      const url = `${urlConfig.URLS.LEARNATHON.LIST}`;
      const requestBody = {
        request: {
          filters: {
            learnathon_content_id: contentId,
            status: "Live",
            // start_date:start_date,
            // end_date:end_date,
          },
        },
      };

      const response = await axios.post(url, requestBody);
      if (response?.data?.result?.totalCount > 0) {
        fetchData(response?.data?.result?.data[0]?.content_id);
        setLearnathonDetails(response?.data?.result?.data[0]);
        setPollId(response?.data?.result?.data[0]?.poll_id);
        setIsLearnathon(true);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
    }
  };

  const CheckAlreadyVoted = async () => {
    if (learnathonDetails?.status === "Live") {
      try {
        const url = `${urlConfig.URLS.POLL.GET_USER_POLL}?poll_id=${pollId}&user_id=${_userId}`;
        const response = await axios.get(url);
        if (
          Array.isArray(response?.data?.result) &&
          response?.data?.result.length !== 0
        ) {
          setAlreadyVoted(true);
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
      }
    }
  };

  useEffect(() => {
    if (pageParam == "vote" || pageParam == "dashboard") {
      CheckLearnathonContent();
    }
  }, [contentId]);
  useEffect(() => {
    if (pageParam == "vote" || pageParam == "dashboard") {
      CheckAlreadyVoted();
    }
  }, [pollId]);

  const handleClick = (poll_id) => {
    navigate(`/webapp/pollDetails?${poll_id}`);
    window.location.reload();
  };
  const Publish = async () => {
    const reqBody = {
      request: {
        content: {
          lastPublishedBy: _userId,
        },
      },
    };
    try {
      const response = await fetch(
        `${urlConfig.URLS.LEARNATHON.PUBLISH}/${playerContent}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reqBody),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to Published");
      }

      const result = await response.json();
      console.log("suceesss----", result);
      console.log(result.result);
      const currentDateTime = new Date();
      currentDateTime.setMinutes(currentDateTime.getMinutes() + 2);
      const updatedDateTime = currentDateTime.toISOString();
      console.log(updatedDateTime, "currentDateAndTime");

      const data = {
        title: learnathonDetails?.title_of_submission,
        description: learnathonDetails?.description,
        visibility: "PublicToAll",
        poll_options: ["I would like to vote this content"],
        poll_type: "Polls",
        start_date: urlConfig.LEARNATHON_DATES.VOTING_START_DATE,
        end_date: urlConfig.LEARNATHON_DATES.VOTING_END_DATE,
        is_live_poll_result: true,
        content_id: learnathonDetails?.learnathon_content_id,
        category: "Learnathon",
        content_category: learnathonDetails?.category_of_participation
      };
      try {
        const response = await fetch(`${urlConfig.URLS.POLL.CREATE}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log("responseData----", learnathonDetails);

          const formData = {
            poll_id: responseData.result.data[0].poll_id,
            status: "Live",
            created_by: learnathonDetails.created_by,
            title_of_submission: learnathonDetails.title_of_submission,
            created_by: learnathonDetails.created_by,
          };

          try {
            const response = await fetch(
              `${urlConfig.URLS.LEARNATHON.UPDATE}?id=${contentId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
              }
            );

            if (!response.ok) {
              throw new Error(t("SOMETHING_WENT_WRONG"));
            } else {
            }

            const result = await response.json();
            console.log("suceesss");
            alert("Published successfully");
            handleBackNavigation();
            window.location.reload();
          } catch (error) {
            throw new Error(t("SOMETHING_WENT_WRONG"));
          } finally {
          }
        } else {
          throw new Error("Failed to create poll");
        }
      } catch (error) {
        // setToasterMessage(error.message);
      }

      // navigate(routeConfig.ROUTES.LEARNATHON.LERNREVIEWLIST);
      // window.location.reload();
      // setData(result.result.data);
      // setTotalRows(result.result.totalCount);
    } catch (error) {
      console.log("error---", error);
      // setError(error.message);
    } finally {
      // setIsLoading(false);
    }
  };
  const Reject = async () => {
    const reqBody = {
      request: {
        content: {
          rejectReasons: [],
          rejectComment: "",
        },
      },
    };
    try {
      const response = await fetch(
        `${urlConfig.URLS.LEARNATHON.REJECT}/${playerContent}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reqBody),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to Reject");
      }

      const result = await response.json();
      console.log("suceesss----", result);
      console.log(result.result);
      const formData = {
        status: "Reject",
        title_of_submission: learnathonDetails.title_of_submission,
        created_by: learnathonDetails.created_by,
      };
      try {
        const response = await fetch(
          `${urlConfig.URLS.LEARNATHON.UPDATE}?id=${contentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          throw new Error("Something went wrong");
        }

        const result = await response.json();
        console.log("suceesss");
        alert("Content Rejected");

        handleBackNavigation();

        window.location.reload();
      } catch (error) {
      } finally {
      }

      // setData(result.result.data);
      // setTotalRows(result.result.totalCount);
    } catch (error) {
      console.log("error---", error);
      // setError(error.message);
    } finally {
      // setIsLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <Box>
        <Container maxWidth="xl" role="main" className="player mt-15">
          <Grid container spacing={2} className="mt-10 mb-30">
            <Grid item xs={12} md={12} lg={12}>
              <Box
                className="d-flex mr-20 my-20 px-10"
                style={{
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Button
                  onClick={handleBackNavigation}
                  className="custom-btn-primary mr-17 mt-15"
                >
                  {t("BACK")}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={9} lg={9}>
              <Box>
                {lesson && (
                  <Breadcrumbs
                    aria-label="breadcrumb"
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                    }}
                  >
                    <Link
                      underline="hover"
                      href=""
                      aria-current="page"
                      color="#484848"
                    >
                      {courseName}
                    </Link>
                  </Breadcrumbs>
                )}
                <Box className="h3-title">
                  {isLearnathon
                    ? learnathonDetails?.title_of_submission
                    : lesson?.name}
                </Box>
              </Box>
              <Box>
                {lesson && (
                  <Box className="xs-mb-20 mt-10">
                    <Typography
                      className="h6-title mb-20"
                      style={{
                        display: "inline-block",
                        verticalAlign: "text-top",
                      }}
                    >
                      {t("CONTENT_TAGS")}:{" "}
                    </Typography>
                    {isLearnathon ? (
                      <Button
                        key={`board`}
                        size="small"
                        style={{
                          color: "#424242",
                          fontSize: "10px",
                          margin: "0 10px 3px 6px",
                          cursor: "auto",
                        }}
                        className="bg-blueShade3"
                      >
                        {learnathonDetails.indicative_theme}
                      </Button>
                    ) : (
                      lesson.board && (
                        <Button
                          key={`board`}
                          size="small"
                          style={{
                            color: "#424242",
                            fontSize: "10px",
                            margin: "0 10px 3px 6px",
                            cursor: "auto",
                          }}
                          className="bg-blueShade3"
                        >
                          {lesson.board}
                        </Button>
                      )
                    )}

                    {!isLearnathon &&
                      !lesson.board &&
                      lesson.se_boards &&
                      lesson.se_boards.map((item, index) => (
                        <Button
                          key={`se_boards-${index}`}
                          size="small"
                          style={{
                            color: "#424242",
                            fontSize: "10px",
                            margin: "0 10px 3px 6px",
                            cursor: "auto",
                          }}
                          className="bg-blueShade3"
                        >
                          {item}
                        </Button>
                      ))}

                    {isLearnathon &&
                      learnathonDetails.indicative_sub_theme &&
                      learnathonDetails.indicative_sub_theme != null ? (
                      <Button
                        key={`board`}
                        size="small"
                        style={{
                          color: "#424242",
                          fontSize: "10px",
                          margin: "0 10px 3px 6px",
                          cursor: "auto",
                        }}
                        className="bg-blueShade3"
                      >
                        {learnathonDetails.indicative_sub_theme}
                      </Button>
                    ) : (
                      lesson.gradeLevel &&
                      lesson.gradeLevel.map((item, index) => (
                        <Button
                          key={`gradeLevel-${index}`}
                          size="small"
                          style={{
                            color: "#424242",
                            fontSize: "10px",
                            margin: "0 10px 3px 6px",
                            cursor: "auto",
                          }}
                          className="bg-blueShade3"
                        >
                          {item}
                        </Button>
                      ))
                    )}
                    {isLearnathon &&
                      learnathonDetails.other_indicative_themes &&
                      learnathonDetails.other_indicative_themes != null && (
                        <Button
                          key={`board`}
                          size="small"
                          style={{
                            color: "#424242",
                            fontSize: "10px",
                            margin: "0 10px 3px 6px",
                            cursor: "auto",
                          }}
                          className="bg-blueShade3"
                        >
                          {learnathonDetails.other_indicative_themes}
                        </Button>
                      )}

                    {!isLearnathon &&
                      !lesson.gradeLevel &&
                      lesson.se_gradeLevels &&
                      lesson.se_gradeLevels.map((item, index) => (
                        <Button
                          key={`se_gradeLevels-${index}`}
                          size="small"
                          style={{
                            color: "#424242",
                            fontSize: "10px",
                            margin: "0 10px 3px 6px",
                            cursor: "auto",
                          }}
                          className="bg-blueShade3"
                        >
                          {item}
                        </Button>
                      ))}
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={3} lg={3} style={{ textAlign: "right" }}>
              <FacebookShareButton url={shareUrl} className="pr-5">
                <FacebookIcon size={32} round={true} />
              </FacebookShareButton>
              <WhatsappShareButton url={shareUrl} className="pr-5">
                <WhatsappIcon size={32} round={true} />
              </WhatsappShareButton>
              <LinkedinShareButton url={shareUrl} className="pr-5">
                <LinkedinIcon size={32} round={true} />
              </LinkedinShareButton>
              <TwitterShareButton url={shareUrl} className="pr-5">
                <img
                  src={require("../../assets/twitter.png")}
                  alt="Twitter"
                  style={{ width: 32, height: 32 }}
                />
              </TwitterShareButton>
            </Grid>
          </Grid>
          <Box
            className="lg-mx-90"
            style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              overflow: "hidden",
              maxWidth: "100%",
            }}
          >
            {lesson ? (
              <SunbirdPlayer
                {...lesson}
                userData={{
                  firstName: userFirstName || "",
                  lastName: userLastName || "",
                }}
                telemetryData={(data) => {
                  handleAssessmentData(data);
                }}
                setTrackData={(data) => {
                  const type = lesson?.mimeType;
                  if (
                    [
                      "assessment",
                      "SelfAssess",
                      "QuestionSet",
                      "QuestionSetImage",
                    ].includes(type)
                  ) {
                    handleTrackData(data);
                  } else if (
                    [
                      "application/vnd.ekstep.html-archive",
                      "application/vnd.ekstep.html-archive",
                      "application/epub",
                    ].includes(type)
                  ) {
                    handleTrackData(data);
                  } else if (
                    ["application/vnd.sunbird.questionset"].includes(type)
                  ) {
                    handleTrackData(
                      data,
                      "application/vnd.sunbird.questionset"
                    );
                  } else if (
                    [
                      "application/pdf",
                      "video/mp4",
                      "video/webm",
                      "video/x-youtube",
                      "application/vnd.ekstep.h5p-archive",
                    ].includes(type)
                  ) {
                    handleTrackData(data, "pdf-video");
                  } else if (
                    ["application/vnd.ekstep.ecml-archive"].includes(type)
                  ) {
                    const score = Array.isArray(data)
                      ? data.reduce((old, newData) => old + newData?.score, 0)
                      : 0;
                    handleTrackData({ ...data, score: `${score}` }, "ecml");
                    setTrackData(data);
                  }
                }}
                public_url={playerUrl}
              />
            ) : (
              <Box>{t("NO_CONTENT_TO_PLAY")}</Box>
            )}
          </Box>
          <Box
            style={{
              paddingBottom: "2%",
              marginTop: "2%",
            }}
          >
            {isLearnathon && learnathonDetails?.status === "Live" && (
              <div className="vote-section">
                <Button
                  type="button"
                  className="custom-btn-primary ml-20"
                  onClick={() => handleClick(pollId)}
                  disabled={alreadyVoted} // Disable button if alreadyVoted is true
                >
                  {t("VOTE_FOR_THIS_CONTENT")}
                </Button>

                {/* Conditionally render the message if alreadyVoted is true */}
                {alreadyVoted && (
                  <Typography variant="body1" color="error" className="ml-20">
                    {t("You have already voted")}
                  </Typography>
                )}
              </div>
            )}
            {reviewEnable && !isPublished && (
              <div className="vote-section">
                <Button
                  type="button"
                  className="custom-btn-primary ml-20"
                  onClick={() => Publish()}
                  disabled={isPublished}
                >
                  {t("PUBLISH")}
                </Button>
                <Button
                  type="button"
                  className="custom-btn-danger ml-20"
                  onClick={() => Reject()}
                  disabled={isPublished}
                >
                  {t("REJECT")}
                </Button>
              </div>
            )}
            <Accordion defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography fontWeight={"700"}>{t("DESCRIPTION")}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  {isLearnathon
                    ? learnathonDetails?.description
                    : lesson?.description}
                </Typography>
                {isLearnathon && (
                  <div>
                    <AccordionSummary
                      aria-controls="panel1-content"
                      id="panel1-header"
                    >
                      <Typography marginLeft={"-22px"} fontWeight={"700"}>
                        {t("CATEGORY_OF_PARTICIPATION")}
                      </Typography>
                    </AccordionSummary>
                    <Typography marginLeft={"0px"}>
                      {learnathonDetails?.category_of_participation}
                    </Typography>
                    <AccordionSummary
                      aria-controls="panel1-content"
                      id="panel1-header"
                    >
                      <Typography marginLeft={"-22px"} fontWeight={"700"}>
                        {t("NAME_OF_ORGANISATION")}
                      </Typography>
                    </AccordionSummary>
                    <Typography marginLeft={"0px"}>
                      {learnathonDetails?.name_of_organisation}
                    </Typography>
                    <AccordionSummary
                      aria-controls="panel1-content"
                      id="panel1-header"
                    >
                      <Typography marginLeft={"-22px"} fontWeight={"700"}>
                        {t("NAME_OF_DEPARTMENT_GROUP")}
                      </Typography>
                    </AccordionSummary>
                    <Typography marginLeft={"0px"}>
                      {learnathonDetails?.name_of_department_group}
                    </Typography>
                    <AccordionSummary
                      aria-controls="panel1-content"
                      id="panel1-header"
                    >
                      <Typography marginLeft={"-22px"} fontWeight={"700"}>
                        {t("INDICATIVE_THEME")}
                      </Typography>
                    </AccordionSummary>
                    <Typography marginLeft={"0px"}>
                      {learnathonDetails?.indicative_theme}
                    </Typography>
                  </div>
                )}
              </AccordionDetails>
            </Accordion>
            {!isLearnathon && (
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel2-content"
                  id="panel2-header"
                >
                  <Typography>{t("ABOUTTHECONTENT")}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {lesson?.attributions && (
                    <>
                      <Box sx={{ fontWeight: "bold" }}>{t("ATTRIBUTIONS")}</Box>
                      <Box>{lesson?.attributions.join(", ")}</Box>
                    </>
                  )}
                  <Box sx={{ fontWeight: "bold" }}>
                    {t("LICENSEDETAILS")} :{" "}
                  </Box>
                  {lesson?.licenseDetails && (
                    <Typography className="mb-10">
                      <Box>
                        {lesson?.licenseDetails.name} -{" "}
                        {lesson?.licenseDetails.description}
                      </Box>
                      <Box className="url-class">
                        <a
                          href={lesson?.licenseDetails.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {lesson?.licenseDetails.url}
                        </a>
                      </Box>
                    </Typography>
                  )}

                  <Typography className="mb-10">
                    <Box sx={{ fontWeight: "bold" }}>{t("COPYRIGHT")} :</Box>
                    <Box>{lesson?.copyright}</Box>
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
          <Box></Box>
        </Container>
        {openFeedBack && (
          <FeedbackPopup
            open={openFeedBack}
            onClose={handleClose}
            className="feedback-popup"
            contentId={contentId}
          />
        )}
        <FloatingChatIcon />
      </Box>
      <Footer />
    </div>
  );
};

export default Player;
