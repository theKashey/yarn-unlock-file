export const extractPackageName = (packageGroupName: string): string => {
  // format is "@atlassian/node-asap@npm:^0.12.4":
  const versionSeparator = packageGroupName.indexOf('@', 1);

  if (versionSeparator < 0) {
    return packageGroupName;
  }

  return packageGroupName.substring(0, versionSeparator);
};
