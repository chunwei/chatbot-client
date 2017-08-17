class Project {
  constructor(projectId) {
    this.id = projectId;
  }
  getId() {
    return this.id;
  }
  setId(id) {
    this.id = id;
  }
}
class IssueType {
  constructor(issuetypeId) {
    this.id = issuetypeId;
  }
  getId() {
    return this.id;
  }
  setId(id) {
    this.id = id;
  }
}
class Priority {
  constructor(priorityId) {
    this.id = priorityId;
  }
  getId() {
    return this.id;
  }
  setId(id) {
    this.id = id;
  }
}
class Fields {
  constructor(summary, description, projectId, priority, issuetypeId) {
    if (typeof projectId == "undefined") projectId = "11206"; //"key": "SOWTWO",
    if (typeof issuetypeId == "undefined") issuetypeId = "1";
    if (typeof priority == "undefined") priority = "3"; //一般
    this.summary = summary;
    this.description = description;
    this.project = new Project(projectId);
    this.issuetype = new IssueType(issuetypeId);
    this.priority = new Priority(priority);
  }

  getPriority() {
    return this.priority;
  }
  setPriority(priority) {
    this.priority = priority;
  }
  getSummary() {
    return this.summary;
  }
  setSummary(summary) {
    this.summary = summary;
  }
  getDescription() {
    return this.description;
  }
  setDescription(description) {
    this.description = description;
  }
  getProject() {
    return this.project;
  }
  setProject(project) {
    this.project = project;
  }
  getIssuetype() {
    return this.issuetype;
  }
  setIssuetype(issuetype) {
    this.issuetype = issuetype;
  }
}
class Issue {
  constructor(summary, description, projectId, priority, issuetypeId) {
    this.fields = new Fields(
      summary,
      description,
      projectId,
      priority,
      issuetypeId
    );
  }

  getFields() {
    return this.fields;
  }

  setFields(fields) {
    this.fields = fields;
  }
  getPriority() {
    return this.fields.getPriority().getId();
  }
  setPriority(priority) {
    this.fields.setPriority(new Priority(priority));
  }
}
class Reporter {
  constructor(username, password, projectid) {
    this.username = username || "lcw";
    this.password = password || "xxx";
    this.projectid = projectid || "11206";
    this.auth = new Buffer(`${username}:${password}`).toString(
      "base64"
    );
  }
  assign(issue_key, assignee) {
    let fields = { fields: { assignee: { name: assignee } } };
    const postData = JSON.stringify(fields);
    const options = {
      hostname: "121.40.168.186",
      port: 8080,
      path: "/jira/rest/api/2/issue/" + issue_key,
      method: "PUT",
      headers: {
        Authorization: "Basic " + this.auth,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };
    const req = http.request(options, res => {
      const {
        statusCode
      } = res;
      const contentType = res.headers["content-type"];
      /* let error;
      if (statusCode != 204) {
        error = new Error("Request Failed.\n" + `Status Code: ${statusCode}`);
      }
      if (error) {
        console.error(error.message);
        //createReponseMessage(`jira assign error:\n ${error.message}`, "error");
        // consume response data to free up memory
        res.resume();
        return;
      } */

      //res.setEncoding("utf8");
      var chunks = [];
      res.on("data", chunk => {
        chunks.push(chunk);
      });
      res.on("end", () => {
        var buffer = Buffer.concat(chunks).toString("utf8");
        console.log(`jira assign result: ${buffer}`);
      });
    });

    req.on("error", e => {
      console.error(`problem with request: ${e.message}`);
    });

    // write data to request body
    req.write(postData);
    req.end();
  }
  report(summary, description, priority, assignee) {
    let issue = new Issue(summary, description, this.projectid, priority);
    const http = require("http");
    //const url = "http://121.40.168.186:8080/jira/rest/api/2/issue";
    const postData = JSON.stringify(issue);

    const options = {
      hostname: "121.40.168.186",
      port: 8080,
      path: "/jira/rest/api/2/issue",
      method: "POST",
      headers: {
        Authorization: "Basic " + this.auth,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, res => {
      //console.log(`STATUS: ${res.statusCode}`);
      //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      const {
        statusCode
      } = res;
      const contentType = res.headers["content-type"];
      let error;
      if (!(statusCode >= 200 && statusCode < 300)) {
        error = new Error("Request Failed.\n" + `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error(
          "Invalid content-type.\n" +
          `Expected application/json but received ${contentType}`
        );
      }
      if (error) {
        console.error(error.message);
        createReponseMessage(`jira report error:\n ${error.message}`, "error");
        // consume response data to free up memory
        res.resume();
        return;
      }

      //res.setEncoding("utf8");
      var chunks = [];
      res.on("data", chunk => {
        chunks.push(chunk);
      });
      res.on("end", () => {
        var buffer = Buffer.concat(chunks).toString("utf8");
        console.log(`jira report result: ${buffer}`);
        try {
          let res = JSON.parse(buffer);
          //{"id":"22897","key":"SOWTWO-272","self":"http://121.40.168.186:8080/jira/rest/api/2/issue/22897"}
          if (res.key) {
            if (assignee) this.assign(res.key, assignee);
            let url = `http://jira.rsvptech.ca:8080/jira/browse/${res.key}`;
            createReponseMessage(url, "link", {
              title: `${res.key}`,
              description: `jira提交成功:key=\n ${res.key}`
            });
          } else {
            createReponseMessage(`jira提交失败:\n ${buffer}`, "error");
          }
        } catch (error) {
          createReponseMessage(`jira提交失败:\n ${buffer}`, "error");
        }
      });
    });

    req.on("error", e => {
      console.error(`problem with request: ${e.message}`);
    });

    // write data to request body
    req.write(postData);
    req.end();
  }
}

//reporter = new Reporter("lcw", "xxx").report("summary", "desc2", "11206",1);
