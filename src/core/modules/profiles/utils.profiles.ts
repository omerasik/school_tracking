import { Profile } from "./types.profiles";

export const formatName = (profile: Profile) => {
  const { first_name: firstName, last_name: lastName } = profile;
  return `${firstName} ${lastName}`;
};

export const getInitials = (profile: Profile) => {
  const { first_name: firstName, last_name: lastName } = profile;
  return `${firstName[0]}${lastName[0]}`;
};