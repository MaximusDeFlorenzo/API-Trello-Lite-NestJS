import { User } from "libs/model/entities/user.entity";
import { Me } from "../dto/me.dto";

export function mapUserToMe(user: User, ktpUrl?: string): Me {
  return {
    _id: user._id,
    email: user.email,
    full_name: user.full_name ?? null,
    phone_number: user.phone_number,
    title: user.title,
    picture: user.picture,
    gender: user.gender,
    linkedin: user.linkedin,
    birthDate: user.birthDate,
    ktpUrl: ktpUrl,
    favoriteClass: user.favoriteClass,
    isChoosePreference: user.isChoosePreference,
  };
}
