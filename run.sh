export APPSODY_PULL_POLICY=IFNOTPRESENT
ln -s /var/run/docker.sock  docker.sock
appsody run
