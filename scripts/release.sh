set -e
echo "Current version:" $(grep version package.json | sed -E 's/^.*"(4[^"]+)".*$/\1/')
echo "Enter alpha version e.g., 2 will generate 4.0.0-alpha.2: "
read ALPHA

VERSION="4.0.0-alpha.$ALPHA"

read -p "Releasing v$VERSION - are you sure? (y/n)" -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Releasing v$VERSION ..."
  yarn run test

  yarn run build
  yarn run build:dts

  # generate the version so that the changelog can be generated too
  yarn version --no-git-tag-version --no-commit-hooks --new-version $VERSION

  # changelog
  yarn run changelog
  echo "Please check the git history and the changelog and press enter"
  read OKAY

  # commit and tag
  git add CHANGELOG.md package.json
  git commit -m "realese: v$VERSION"
  git tag "v$VERSION"

  # commit
  # TODO: make sure this works the next time
  yarn publish --tag next --new-version $VERSION --no-commit-hooks --no-git-tag-version

  # publish
  git push origin refs/tags/v$VERSION
  git push
fi
