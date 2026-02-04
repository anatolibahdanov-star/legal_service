"use client"; 

import Image from 'next/image';

export const AdministratorAdminIcon = () => {
  return (
    <Image
      src="/icons/administrators.png"
      alt="Administrator icon"
      width={24}
      height={24}
    />
  );
};

export const StatisticAdminIcon = () => {
  return (
    <Image
      src="/icons/statistics.png"
      alt="Statistics icon"
      width={24}
      height={24}
    />
  );
};

export const QuestionAdminIcon = () => {
  return (
    <Image
      src="/icons/questions.png"
      alt="User Question icon"
      width={24}
      height={24}
    />
  );
};

export const OkAdminIcon = () => {
  return (
    <Image
      src="/icons/ok.png"
      alt="Active icon"
      width={24}
      height={24}
    />
  );
};

export const NotOkAdminIcon = () => {
  return (
    <Image
      src="/icons/notok.png"
      alt="Banned icon"
      width={24}
      height={24}
    />
  );
};