export const extractPackageName = (packageGroupName: string): string => {
  // format is "@atlassian/node-asap@npm:^0.12.4":
  const versionSeparator = packageGroupName.indexOf('@', 1);

  return packageGroupName.substring(0, versionSeparator);
};
