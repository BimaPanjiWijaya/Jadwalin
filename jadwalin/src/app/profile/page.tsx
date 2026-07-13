"use client";

import React, { useState, useEffect } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  telegramChatId: string | null;
};
