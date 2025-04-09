import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  TextField,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Footer from "components/Footer";
import Header from "components/header";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
const routeConfig = require("../../configs/routeConfig.json");
const urlConfig = require("../../configs/urlConfig.json");
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

const LernVotingList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState("");
  const [pollData, setPollData] = useState([]);
  const [voteCounts, setVoteCounts] = useState({}); // Object to store vote counts
  const [pageNumber, setPageNumber] = useState(1);
  // const [pageNumber, setCurrentPage] = useState(1);
  const [value, setValue] = React.useState("1");
  const [selectedTab, setSelectedTab] = useState("1");

  const tabChange = (event, newValue) => {
    setValue(newValue);
    setSelectedTab(newValue);
  };


  useEffect(() => {
    fetchData();
  }, [selectedTab, pageNumber, search]);

  const categoryMap = {
    "1": "State / UT / SPVs / ULBs / Any Other",
    "2": "Industry",
    "3": "Academia",
  };

  const fetchData = async () => {
    let selectedCategory = "";
    if (selectedTab === "1") {
      selectedCategory = "State / UT / SPVs / ULBs / Any Other";
    } else if (selectedTab === "2") {
      selectedCategory = "Industry";
    } else if (selectedTab === "3") {
      selectedCategory = "Academia";
    }

    const assetBody = {
      request: {
        filters: {
          category: "Learnathon",
          status: ["Live"],
          content_category: selectedCategory,
        },
        limit: rowsPerPage,
        offset: 10 * (pageNumber - 1),
        search: search,
      },
    };


    try {
      const response = await fetch(`${urlConfig.URLS.POLL.LIST}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assetBody),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch polls");
      }

      const result = await response.json();
      setData(result.result.data);
      const pollIds = result.result.data.map((poll) => poll.poll_id);
      setPollData(pollIds);
      setTotalRows(Math.ceil(result.result.totalCount / 10));

      getVoteCounts(pollIds);
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };



  const getVoteCounts = async (pollIds) => {
    try {
      const url = `${urlConfig.URLS.POLL.GET_VOTTING_LIST}`;
      const body = {
        poll_ids: pollIds,
      };
      const response = await axios.post(url, body);
      const data = response.data;

      // Map vote counts by poll_id
      const voteCountMap = {};
      data.result.polls.forEach((poll) => {
        voteCountMap[poll.poll_id] = poll.result[0].count; // Assuming result contains vote count
      });

      setVoteCounts(voteCountMap); // Set the vote count in state
    } catch (error) {
      console.error("Error fetching vote counts:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0); // Reset to first page on search
  };

  const handleClick = (contentId) => {
    navigate(
      `${routeConfig.ROUTES.PLAYER_PAGE.PLAYER}?id=${contentId}&page=vote`
    );
  };

  const handleChange = (event, value) => {
    if (value !== pageNumber) {
      setPageNumber(value);
      fetchData();
    }
  };

  return (
    <>
      <Header />
      <Box sx={{ padding: "20px" }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" gutterBottom className="fw-600 mt-20">
            {t("VOTE_NOW_LEARNATHON_SUBMISSIONS")}
          </Typography>
        </Box>
        <Grid container>
          <Grid item xs={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <TextField
                variant="outlined"
                placeholder={t("SEARCH_SUBMISSION")}
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  endAdornment: <SearchIcon />,
                }}
                size="small"
                sx={{ background: "#fff" }}
              />
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ width: '100%', typography: 'body1' }}>
          <TabContext value={value} centered>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }} mb={4}>
              <TabList onChange={tabChange} aria-label="lab API tabs example" sx={{
                justifyContent: 'center',
                display: 'flex',
              }}>
                <Tab label="State / UT / SPVs / ULBs / Any Other" value="1" />
                <Tab label="Industry" value="2" />
                {/* <Tab label="Academia" value="3" /> */}
              </TabList>
            </Box>
            <TabPanel value={value}>
              <TableContainer component={Paper}>
                <Table aria-label="simple table">
                  <TableHead sx={{ background: "#D8F6FF" }}>
                    <TableRow>
                      <TableCell>{t("SUBMISSION_NAME")}</TableCell>
                      <TableCell>{t("VOTING_DEADLINE")}</TableCell>
                      <TableCell>{t("VOTE_COUNT")}</TableCell>
                      <TableCell>{t("VOTE_NOW")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data
                      .filter((row) => row.content_category === categoryMap[value])
                      .map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.title}</TableCell>
                          <TableCell>
                            {new Date(row.end_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {voteCounts[row.poll_id] || 0}
                            <span style={{ fontSize: "1.5rem", marginLeft: "5px" }}>
                              👍
                            </span>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Button
                                type="button"
                                className="custom-btn-primary ml-20"
                                onClick={() => handleClick(row.content_id)}
                              >
                                {t("VIEW_AND_VOTE")}
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </TabContext>
        </Box>
        <Pagination
          count={totalRows}
          page={pageNumber}
          onChange={handleChange}
        />
      </Box>
      <Footer />
    </>
  );
};

export default LernVotingList;
