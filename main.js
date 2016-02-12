const Q = require('q');
const Git = require('nodegit');

const planetMocha = 'https://github.com/subvisual/planet-mocha';

const getRepository = repositoryUrl => {
  return Git.Clone(repositoryUrl, 'tmp');
}

const getLastCommit = repository => {
  return repository.getBranchCommit("master");
}

const getCommitMessage = commit => {
  return commit.message();
}

const getCommitOid = commit => {
  return commit.sha();
}

const getHistory = repository => {
  const deferred = Q.defer();

  getLastCommit(repository)
    .then(commit => {
      deferred.resolve(commit.history());
    })
    .catch(error => {
      deferred.reject(error);
    });

  return deferred.promise;
}

const bufferCommits = store => commit => {
  store.push(commit);
}

const readHistory = history => {
  const commits = [];
  const deferred = Q.defer();

  const buffer = bufferCommits(commits);

  history.on('commit', buffer);

  history.on('end', () => {
    deferred.resolve(commits);
  });

  history.on('error', error => {
    deferred.reject(error);
  });

  history.start();

  return deferred.promise;
}

const getOids = commits => {
  return commits.map(getCommitOid);
}

const checkoutToLast = repository => oids => {
  const oid = oids[oids.length - 1];

  return repository.setHeadDetached(oid);
}

getRepository(planetMocha)
  .then(repository => {
    return getHistory(repository)
      .then(readHistory)
      .then(getOids)
      .then(checkoutToLast(repository))
      .then((result) => {
        console.log(result, 'checkout complete');
      });
  })
  .catch(err => {
    console.log(err);
  });
